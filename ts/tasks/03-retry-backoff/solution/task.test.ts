import { backoffDelay, retry } from './task';

const one = () => 0.999999; // ≈ maximální jitter → zpoždění = cap (zaokrouhleno dolů)

describe('backoffDelay', () => {
  it('grows exponentially and is capped', () => {
    const r = () => 0.5;
    expect([0, 1, 2, 3, 4, 5].map((n) => backoffDelay(n, 100, 1000, r))).toEqual([
      50, 100, 200, 400, 500, 500,
    ]);
  });

  it('full jitter: random 0 → 0 ms', () => {
    expect(backoffDelay(3, 100, 1000, () => 0)).toBe(0);
  });
});

describe('retry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the first success without waiting', async () => {
    const fn = jest.fn(async () => 'ok');
    await expect(retry(fn, { retries: 3, baseDelayMs: 100, maxDelayMs: 1000 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1, undefined);
  });

  it('retries with backoff and eventually succeeds', async () => {
    const fn = jest
      .fn<Promise<string>, [number, AbortSignal?]>()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValue('ok');

    const p = retry(fn, { retries: 5, baseDelayMs: 100, maxDelayMs: 10_000, random: one });

    await jest.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(98); // první čekání ≈ 99 ms
    expect(fn).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(198); // druhé ≈ 199 ms
    expect(fn).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);

    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
  });

  it('gives up after retries + 1 attempts with the LAST error', async () => {
    let n = 0;
    const fn = jest.fn(async () => {
      throw new Error(`fail ${++n}`);
    });
    const p = retry(fn, { retries: 2, baseDelayMs: 10, maxDelayMs: 100, random: one });
    const assertion = expect(p).rejects.toThrow('fail 3');
    await jest.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries: 0 → exactly one attempt', async () => {
    const fn = jest.fn(async () => {
      throw new Error('nope');
    });
    await expect(retry(fn, { retries: 0, baseDelayMs: 10, maxDelayMs: 10 })).rejects.toThrow('nope');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops immediately when shouldRetry says no', async () => {
    class ValidationError extends Error {}
    const fn = jest.fn(async () => {
      throw new ValidationError('bad input');
    });
    const shouldRetry = jest.fn((err: unknown) => !(err instanceof ValidationError));
    await expect(
      retry(fn, { retries: 5, baseDelayMs: 10, maxDelayMs: 10, shouldRetry }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(ValidationError), 1);
  });

  it('does not call fn at all when signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort(new Error('cancelled'));
    const fn = jest.fn(async () => 'ok');
    await expect(
      retry(fn, { retries: 3, baseDelayMs: 10, maxDelayMs: 10, signal: ac.signal }),
    ).rejects.toThrow('cancelled');
    expect(fn).not.toHaveBeenCalled();
  });

  it('aborts promptly DURING the backoff wait', async () => {
    const ac = new AbortController();
    const fn = jest.fn(async () => {
      throw new Error('transient');
    });
    const p = retry(fn, {
      retries: 10,
      baseDelayMs: 10_000,
      maxDelayMs: 60_000,
      signal: ac.signal,
      random: one,
    });
    const assertion = expect(p).rejects.toMatchObject({ name: 'AbortError' });

    await jest.advanceTimersByTimeAsync(100); // jsme uprostřed 10s čekání
    ac.abort(); // default reason = DOMException AbortError
    await jest.advanceTimersByTimeAsync(0);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0); // timer po abortu uklizen
  });

  it('passes the signal to fn so it can cancel its own work', async () => {
    const ac = new AbortController();
    const fn = jest.fn(async (_attempt: number, signal?: AbortSignal) => signal);
    await expect(
      retry(fn, { retries: 1, baseDelayMs: 1, maxDelayMs: 1, signal: ac.signal }),
    ).resolves.toBe(ac.signal);
  });

  it('abort that happens while fn runs wins over fn error', async () => {
    const ac = new AbortController();
    const fn = jest.fn(async () => {
      ac.abort(new Error('shutdown'));
      throw new Error('ECONNRESET');
    });
    await expect(
      retry(fn, { retries: 3, baseDelayMs: 1, maxDelayMs: 1, signal: ac.signal }),
    ).rejects.toThrow('shutdown');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

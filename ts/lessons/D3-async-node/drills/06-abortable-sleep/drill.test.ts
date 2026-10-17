import { sleep } from './drill';

describe('drill 06 — zrušitelný sleep (AbortSignal ≈ ctx.Done())', () => {
  it('bez signalu se chová jako obyčejný sleep', async () => {
    const start = Date.now();
    await sleep(30);
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });

  it('už zrušený signal → okamžitý reject s signal.reason', async () => {
    const ac = new AbortController();
    const reason = new Error('already cancelled');
    ac.abort(reason);
    const start = Date.now();
    await expect(sleep(1000, ac.signal)).rejects.toBe(reason);
    expect(Date.now() - start).toBeLessThan(20);
  });

  it('abort během čekání → reject hned, ne až po ms', async () => {
    const ac = new AbortController();
    const reason = new Error('client gone');
    setTimeout(() => ac.abort(reason), 20);
    const start = Date.now();
    await expect(sleep(1000, ac.signal)).rejects.toBe(reason);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('funguje s AbortSignal.timeout (reason je TimeoutError)', async () => {
    await expect(sleep(1000, AbortSignal.timeout(20))).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('po normálním doběhnutí odregistruje abort listener (žádný leak)', async () => {
    const ac = new AbortController();
    const add = jest.spyOn(ac.signal, 'addEventListener');
    const remove = jest.spyOn(ac.signal, 'removeEventListener');
    await sleep(5, ac.signal);
    expect(add).toHaveBeenCalledWith('abort', expect.any(Function), expect.anything());
    expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0]![1]);
    ac.abort(); // pozdní abort už nesmí nic rozbít
  });

  it('po abortu uklidí timer (proces/Jest nedrží open handle)', async () => {
    jest.useFakeTimers();
    try {
      const ac = new AbortController();
      const p = sleep(10_000, ac.signal);
      expect(jest.getTimerCount()).toBe(1);
      ac.abort(new Error('stop'));
      await expect(p).rejects.toThrow('stop');
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

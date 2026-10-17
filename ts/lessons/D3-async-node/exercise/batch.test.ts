import { processBatch, retry } from './batch';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('retry', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('vrátí výsledek prvního úspěšného pokusu a předá číslo pokusu', async () => {
    const attempts: number[] = [];
    const v = await retry(
      async (a) => {
        attempts.push(a);
        if (a < 2) throw new Error(`fail ${a}`);
        return 'ok';
      },
      { retries: 3, baseMs: 1 },
    );
    expect(v).toBe('ok');
    expect(attempts).toEqual([0, 1, 2]);
  });

  it('po vyčerpání pokusů vyhodí POSLEDNÍ chybu (1 + retries pokusů)', async () => {
    const fn = jest.fn(async (a: number) => {
      throw new Error(`fail ${a}`);
    });
    await expect(retry(fn, { retries: 2, baseMs: 1 })).rejects.toThrow('fail 2');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('default retries = 3', async () => {
    const fn = jest.fn(async () => {
      throw new Error('x');
    });
    await expect(retry(fn, { baseMs: 1 })).rejects.toThrow('x');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('shouldRetry=false → vyhodí hned, bez čekání', async () => {
    const fn = jest.fn(async () => {
      throw new Error('400 bad request');
    });
    await expect(retry(fn, { retries: 5, baseMs: 1000, shouldRetry: () => false })).rejects.toThrow('400');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exponential backoff s full jitter, omezený maxMs', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(1); // jitter na maximum → deterministické
    const t0 = Date.now();
    const calledAt: number[] = [];
    const p = retry(
      async () => {
        calledAt.push(Date.now() - t0);
        throw new Error('x');
      },
      { retries: 4, baseMs: 100, maxMs: 300 },
    );
    const assertion = expect(p).rejects.toThrow('x');
    await jest.runAllTimersAsync();
    await assertion;
    // čekání: 100, 200, 300 (strop), 300 (strop)
    expect(calledAt).toEqual([0, 100, 300, 600, 900]);
  });

  it('jitter: Math.random() = 0 → žádné čekání', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const start = Date.now();
    await expect(
      retry(async () => Promise.reject(new Error('x')), { retries: 3, baseMs: 1000 }),
    ).rejects.toThrow('x');
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('už zrušený signal → fn se vůbec nezavolá', async () => {
    const ac = new AbortController();
    ac.abort(new Error('cancelled'));
    const fn = jest.fn(async () => 'x');
    await expect(retry(fn, { signal: ac.signal })).rejects.toThrow('cancelled');
    expect(fn).not.toHaveBeenCalled();
  });

  it('abort během backoffu → reject hned, další pokus už neproběhne', async () => {
    const ac = new AbortController();
    const fn = jest.fn(async () => {
      throw new Error('flaky');
    });
    jest.spyOn(Math, 'random').mockReturnValue(1);
    setTimeout(() => ac.abort(new Error('shutdown')), 30);
    const start = Date.now();
    await expect(retry(fn, { retries: 5, baseMs: 2000, signal: ac.signal })).rejects.toThrow('shutdown');
    expect(Date.now() - start).toBeLessThan(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('processBatch', () => {
  it('zpracuje vše, výsledky v pořadí vstupu', async () => {
    const res = await processBatch(
      [3, 1, 2],
      async (x) => {
        await sleep(x * 10);
        return x * 100;
      },
      { concurrency: 3 },
    );
    expect(res).toEqual({
      ok: [
        { item: 3, value: 300 },
        { item: 1, value: 100 },
        { item: 2, value: 200 },
      ],
      failed: [],
    });
  });

  it('dodrží limit souběžnosti a limit využije', async () => {
    let inFlight = 0;
    let max = 0;
    await processBatch(
      Array.from({ length: 15 }, (_, i) => i),
      async (x) => {
        inFlight++;
        max = Math.max(max, inFlight);
        await sleep(5 + (x % 3) * 5);
        inFlight--;
        return x;
      },
      { concurrency: 4 },
    );
    expect(max).toBe(4);
  });

  it('selhání položky nezastaví ostatní — chyby sesbírá v pořadí vstupu', async () => {
    const res = await processBatch(
      ['a', 'bad1', 'b', 'bad2', 'c'],
      async (s) => {
        await sleep(5);
        if (s.startsWith('bad')) throw new Error(`cannot ${s}`);
        return s.toUpperCase();
      },
      { concurrency: 2 },
    );
    expect(res.ok).toEqual([
      { item: 'a', value: 'A' },
      { item: 'b', value: 'B' },
      { item: 'c', value: 'C' },
    ]);
    expect(res.failed.map((f) => f.item)).toEqual(['bad1', 'bad2']);
    expect((res.failed[0]!.error as Error).message).toBe('cannot bad1');
  });

  it('každou položku retryuje (opts.retries)', async () => {
    const calls = new Map<number, number>();
    const res = await processBatch(
      [1, 2, 3],
      async (x) => {
        const n = (calls.get(x) ?? 0) + 1;
        calls.set(x, n);
        if (x === 2 && n < 3) throw new Error('flaky');
        return x;
      },
      { concurrency: 2, retries: 2, baseMs: 1 },
    );
    expect(res.failed).toEqual([]);
    expect(res.ok.map((o) => o.value)).toEqual([1, 2, 3]);
    expect(calls.get(2)).toBe(3);
  });

  it('bez opts.retries položku neopakuje (default 0)', async () => {
    const worker = jest.fn(async () => {
      throw new Error('x');
    });
    const res = await processBatch([1], worker, { concurrency: 1 });
    expect(worker).toHaveBeenCalledTimes(1);
    expect(res.failed).toHaveLength(1);
  });

  it('worker dostane AbortSignal', async () => {
    const seen: unknown[] = [];
    await processBatch(
      [1],
      async (_x, signal) => {
        seen.push(signal);
        return 1;
      },
      { concurrency: 1 },
    );
    expect(seen[0]).toBeInstanceOf(AbortSignal);
  });

  it('abort: nespustí další položky, rejectne s reason a abortne signal workerů', async () => {
    const ac = new AbortController();
    const started: number[] = [];
    const workerSignals: AbortSignal[] = [];
    const p = processBatch(
      Array.from({ length: 20 }, (_, i) => i),
      async (x, signal) => {
        started.push(x);
        workerSignals.push(signal);
        await sleep(20);
        return x;
      },
      { concurrency: 2, signal: ac.signal },
    );
    setTimeout(() => ac.abort(new Error('shutdown')), 50);
    await expect(p).rejects.toThrow('shutdown');
    const startedAtAbort = started.length;
    expect(startedAtAbort).toBeLessThan(10);
    await sleep(60);
    expect(started.length).toBe(startedAtAbort); // po abortu nic nového
    expect(workerSignals.every((s) => s.aborted)).toBe(true);
  });

  it('už zrušený signal → žádný worker se nezavolá', async () => {
    const ac = new AbortController();
    ac.abort(new Error('nope'));
    const worker = jest.fn(async (x: number) => x);
    await expect(processBatch([1, 2, 3], worker, { concurrency: 2, signal: ac.signal })).rejects.toThrow('nope');
    expect(worker).not.toHaveBeenCalled();
  });

  it('prázdný vstup', async () => {
    await expect(processBatch([], async (x: number) => x, { concurrency: 3 })).resolves.toEqual({ ok: [], failed: [] });
  });
});

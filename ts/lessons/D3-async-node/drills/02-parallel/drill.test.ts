import { fetchParallel, fetchSequential } from './drill';

const fakeFetch = (id: number) =>
  new Promise<string>((resolve) => setTimeout(() => resolve(`user-${id}`), 40 - id * 10));

describe('drill 02 — sekvenčně vs paralelně', () => {
  it('fetchSequential: správné pořadí, čas ≈ součet', async () => {
    const start = Date.now();
    const res = await fetchSequential([1, 2, 3], fakeFetch);
    const elapsed = Date.now() - start;
    expect(res).toEqual(['user-1', 'user-2', 'user-3']);
    expect(elapsed).toBeGreaterThanOrEqual(55); // 30 + 20 + 10
  });

  it('fetchParallel: správné pořadí (i když 3 doběhne první), čas ≈ maximum', async () => {
    const start = Date.now();
    const res = await fetchParallel([1, 2, 3], fakeFetch);
    const elapsed = Date.now() - start;
    expect(res).toEqual(['user-1', 'user-2', 'user-3']);
    expect(elapsed).toBeLessThan(55);
  });

  it('fetchParallel: první chyba rejectne celé volání', async () => {
    const failing = (id: number) => (id === 2 ? Promise.reject(new Error('boom')) : fakeFetch(id));
    await expect(fetchParallel([1, 2, 3], failing)).rejects.toThrow('boom');
  });

  it('fetchSequential: po chybě už další id nevolá', async () => {
    const called: number[] = [];
    const failing = async (id: number) => {
      called.push(id);
      if (id === 2) throw new Error('boom');
      return `user-${id}`;
    };
    await expect(fetchSequential([1, 2, 3], failing)).rejects.toThrow('boom');
    expect(called).toEqual([1, 2]);
  });
});

import { mapWithConcurrency } from './drill';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function tracked() {
  const state = { inFlight: 0, max: 0, started: [] as number[] };
  const fn = async (x: number, i: number) => {
    state.started.push(i);
    state.inFlight++;
    state.max = Math.max(state.max, state.inFlight);
    await sleep(5 + ((x * 7) % 4) * 5); // různě dlouhé úlohy
    state.inFlight--;
    return x * 10;
  };
  return { state, fn };
}

describe('drill 05 — mapWithConcurrency', () => {
  it('nikdy nepřekročí limit a limit opravdu využije', async () => {
    const { state, fn } = tracked();
    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 3, fn);
    expect(state.max).toBe(3);
  });

  it('zachová pořadí výsledků podle vstupu', async () => {
    const { fn } = tracked();
    const items = Array.from({ length: 12 }, (_, i) => i);
    await expect(mapWithConcurrency(items, 4, fn)).resolves.toEqual(items.map((x) => x * 10));
  });

  it('předává index a každou položku zpracuje právě jednou', async () => {
    const { state, fn } = tracked();
    await mapWithConcurrency([5, 6, 7, 8, 9], 2, fn);
    expect([...state.started].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('limit větší než počet položek', async () => {
    const { state, fn } = tracked();
    await expect(mapWithConcurrency([1, 2], 10, fn)).resolves.toEqual([10, 20]);
    expect(state.max).toBe(2);
  });

  it('prázdný vstup', async () => {
    await expect(mapWithConcurrency([], 3, async (x: number) => x)).resolves.toEqual([]);
  });

  it('je opravdu paralelní: 8 × 30 ms s limitem 4 ≈ 60 ms', async () => {
    const start = Date.now();
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 4, () => sleep(30));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(55);
    expect(elapsed).toBeLessThan(110);
  });

  it('není to dávkování po `limit`: jakmile worker doběhne, bere další', async () => {
    // [100 ms, 6 × 10 ms], limit 2 → pool ≈ 100 ms; dávky po dvou ≈ 100 + 3 × 10 = 130 ms
    const durations = [100, 10, 10, 10, 10, 10, 10];
    const start = Date.now();
    await mapWithConcurrency(durations, 2, (ms) => sleep(ms));
    expect(Date.now() - start).toBeLessThan(120);
  });

  it('chyba ve fn rejectne výsledek', async () => {
    const fn = async (x: number) => {
      await sleep(1);
      if (x === 3) throw new Error('bad 3');
      return x;
    };
    await expect(mapWithConcurrency([1, 2, 3, 4], 2, fn)).rejects.toThrow('bad 3');
  });
});

import { mapWithConcurrency } from './task';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Sleduje, kolik volání běží zároveň. */
function tracker() {
  let active = 0;
  let max = 0;
  const started: number[] = [];
  return {
    get max() {
      return max;
    },
    started,
    async run<R>(index: number, ms: number, value: R): Promise<R> {
      started.push(index);
      active++;
      max = Math.max(max, active);
      try {
        await sleep(ms);
        return value;
      } finally {
        active--;
      }
    },
  };
}

describe('mapWithConcurrency', () => {
  it('preserves input order even when tasks finish out of order', async () => {
    const delays = [30, 5, 20, 1, 10];
    const out = await mapWithConcurrency(delays, 2, async (ms, i) => {
      await sleep(ms);
      return `#${i}`;
    });
    expect(out).toEqual(['#0', '#1', '#2', '#3', '#4']);
  });

  it('never exceeds the limit, but actually uses it', async () => {
    const t = tracker();
    const items = Array.from({ length: 12 }, (_, i) => i);
    const out = await mapWithConcurrency(items, 3, (i) => t.run(i, 5 + (i % 3) * 5, i * 2));
    expect(out).toEqual(items.map((i) => i * 2));
    expect(t.max).toBe(3);
  });

  it('runs everything at once when limit >= items.length', async () => {
    const t = tracker();
    await mapWithConcurrency([1, 2, 3], 10, (i) => t.run(i, 10, i));
    expect(t.max).toBe(3);
  });

  it('limit 1 means strictly sequential', async () => {
    const t = tracker();
    await mapWithConcurrency([1, 2, 3, 4], 1, (i) => t.run(i, 2, i));
    expect(t.max).toBe(1);
    expect(t.started).toEqual([1, 2, 3, 4]);
  });

  it('empty input → empty array, fn never called', async () => {
    const fn = jest.fn(async (x: number) => x);
    await expect(mapWithConcurrency([], 4, fn)).resolves.toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('rejects with the first error and starts nothing new after it', async () => {
    const started: number[] = [];
    const items = Array.from({ length: 10 }, (_, i) => i);
    const boom = new Error('boom at 1');

    const p = mapWithConcurrency(items, 2, async (i) => {
      started.push(i);
      if (i === 1) {
        await sleep(5);
        throw boom;
      }
      await sleep(20);
      return i;
    });

    await expect(p).rejects.toBe(boom);
    await sleep(60); // dej šanci případným dalším startům
    expect(started).toEqual([0, 1]);
  });

  it('works with fn that throws synchronously inside async', async () => {
    await expect(
      mapWithConcurrency([1, 2], 2, async () => {
        throw new TypeError('sync-ish');
      }),
    ).rejects.toThrow(TypeError);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid limit %p with RangeError', async (limit) => {
    await expect(mapWithConcurrency([1], limit, async (x) => x)).rejects.toThrow(RangeError);
  });

  it('handles 10k items without stack or memory issues', async () => {
    const items = Array.from({ length: 10_000 }, (_, i) => i);
    const out = await mapWithConcurrency(items, 16, async (i) => i + 1);
    expect(out).toHaveLength(10_000);
    expect(out[9_999]).toBe(10_000);
  });
});

import { summarize } from './drill';

const ok = (v: number, ms = 5) => () => new Promise<number>((r) => setTimeout(() => r(v), ms));
const fail = (msg: string, ms = 5) => () =>
  new Promise<number>((_, rej) => setTimeout(() => rej(new Error(msg)), ms));

describe('drill 03 — allSettled sumarizace', () => {
  it('rozdělí úspěchy a chyby se zachováním pořadí', async () => {
    const res = await summarize([ok(1, 20), fail('a'), ok(2), fail('b', 15), ok(3, 1)]);
    expect(res).toEqual({ ok: [1, 2, 3], errors: ['a', 'b'] });
  });

  it('nikdy nerejectne, i když selže všechno', async () => {
    await expect(summarize([fail('x'), fail('y')])).resolves.toEqual({ ok: [], errors: ['x', 'y'] });
  });

  it('ne-Error reason převede přes String()', async () => {
    const res = await summarize([() => Promise.reject('plain string'), () => Promise.reject(42)]);
    expect(res.errors).toEqual(['plain string', '42']);
  });

  it('spustí všechny tasky souběžně', async () => {
    const start = Date.now();
    await summarize([ok(1, 40), ok(2, 40), fail('z', 40)]);
    expect(Date.now() - start).toBeLessThan(90);
  });

  it('prázdný vstup', async () => {
    await expect(summarize([])).resolves.toEqual({ ok: [], errors: [] });
  });
});

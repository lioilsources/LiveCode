import { sleep } from './drill';

describe('drill 01 — sleep', () => {
  it('vrací Promise<void>', () => {
    const p = sleep(1);
    expect(p).toBeInstanceOf(Promise);
    return p;
  });

  it('počká zhruba ms', async () => {
    const start = Date.now();
    const v = await sleep(40);
    const elapsed = Date.now() - start;
    expect(v).toBeUndefined();
    expect(elapsed).toBeGreaterThanOrEqual(35);
    expect(elapsed).toBeLessThan(200);
  });

  it('tři sleepy souběžně trvají jako jeden (Promise.all)', async () => {
    const start = Date.now();
    await Promise.all([sleep(40), sleep(40), sleep(40)]);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

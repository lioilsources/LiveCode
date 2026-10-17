import { LruCache } from './task';

function setup(capacity = 3, ttlMs = 1000) {
  let t = 0;
  const cache = new LruCache<string, number>({ capacity, ttlMs, now: () => t });
  return { cache, advance: (ms: number) => (t += ms) };
}

describe('LruCache — LRU', () => {
  it('get/set basics', () => {
    const { cache } = setup();
    expect(cache.get('a')).toBeUndefined();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.has('a')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('evicts the least recently SET when full', () => {
    const { cache } = setup(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('get() refreshes recency', () => {
    const { cache } = setup(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // a je teď nejčerstvější
    cache.set('c', 3); // vyhodí b
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
  });

  it('overwriting a key refreshes recency and does not grow size', () => {
    const { cache } = setup(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    cache.set('c', 3); // vyhodí b
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBeUndefined();
  });

  it('stores falsy values correctly', () => {
    const { cache } = setup();
    cache.set('zero', 0);
    expect(cache.get('zero')).toBe(0);
    expect(cache.has('zero')).toBe(true);
  });

  it('delete removes', () => {
    const { cache } = setup();
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.delete('a')).toBe(false);
  });

  it('rejects capacity < 1', () => {
    expect(() => new LruCache({ capacity: 0, ttlMs: 1 })).toThrow(RangeError);
  });

  it('works with object keys by reference', () => {
    const cache = new LruCache<object, string>({ capacity: 2, ttlMs: 1000 });
    const k = { id: 1 };
    cache.set(k, 'x');
    expect(cache.get(k)).toBe('x');
    expect(cache.get({ id: 1 })).toBeUndefined();
  });

  it('is O(1)-ish: 100k operations stay fast', () => {
    const { cache } = setup(1000);
    const start = Date.now();
    for (let i = 0; i < 100_000; i++) {
      cache.set(`k${i}`, i);
      cache.get(`k${i - 500}`);
    }
    expect(cache.size).toBe(1000);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe('LruCache — TTL', () => {
  it('expires entries after ttlMs', () => {
    const { cache, advance } = setup(3, 1000);
    cache.set('a', 1);
    advance(999);
    expect(cache.get('a')).toBe(1);
    advance(1);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.has('a')).toBe(false);
  });

  it('get() does not extend TTL, set() does', () => {
    const { cache, advance } = setup(3, 1000);
    cache.set('a', 1);
    advance(600);
    cache.get('a');
    advance(600);
    expect(cache.get('a')).toBeUndefined();

    cache.set('b', 2);
    advance(600);
    cache.set('b', 3);
    advance(600);
    expect(cache.get('b')).toBe(3);
  });
});

describe('LruCache — getOrLoad (singleflight)', () => {
  it('loads on miss, serves from cache on hit', async () => {
    const { cache } = setup();
    const loader = jest.fn(async () => 42);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(42);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('concurrent misses for the same key share ONE loader call', async () => {
    const { cache } = setup();
    let resolve!: (v: number) => void;
    const loader = jest.fn(() => new Promise<number>((r) => (resolve = r)));

    const p1 = cache.getOrLoad('a', loader);
    const p2 = cache.getOrLoad('a', loader);
    const p3 = cache.getOrLoad('a', loader);
    expect(loader).toHaveBeenCalledTimes(1);

    resolve(7);
    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([7, 7, 7]);
    expect(cache.get('a')).toBe(7);
  });

  it('different keys load independently', async () => {
    const { cache } = setup();
    const loader = jest.fn(async () => 1);
    await Promise.all([cache.getOrLoad('a', loader), cache.getOrLoad('b', loader)]);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('loader error rejects all waiters, is not cached, next call retries', async () => {
    const { cache } = setup();
    const loader = jest
      .fn<Promise<number>, []>()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce(5);

    const [r1, r2] = await Promise.allSettled([
      cache.getOrLoad('a', loader),
      cache.getOrLoad('a', loader),
    ]);
    expect(r1).toMatchObject({ status: 'rejected', reason: new Error('db down') });
    expect(r2).toMatchObject({ status: 'rejected' });
    expect(loader).toHaveBeenCalledTimes(1);

    await expect(cache.getOrLoad('a', loader)).resolves.toBe(5);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('reloads after TTL expiry', async () => {
    const { cache, advance } = setup(3, 1000);
    const loader = jest.fn<Promise<number>, []>().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    await cache.getOrLoad('a', loader);
    advance(1000);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(2);
  });
});

export interface LruCacheOptions {
  capacity: number;
  ttlMs: number;
  /** Hodiny v ms — injektovatelné kvůli testům. */
  now?: () => number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

/**
 * LRU + TTL nad jedinou Map. Trik: Map iteruje v pořadí VLOŽENÍ, takže
 * „delete + set" přesune klíč na konec (nejčerstvější) a první klíč
 * z `keys()` je nejdéle nepoužitý. Žádný spojový seznam není potřeba.
 */
export class LruCache<K, V> {
  private readonly entries = new Map<K, Entry<V>>();
  private readonly inflight = new Map<K, Promise<V>>();
  private readonly now: () => number;

  constructor(private readonly opts: LruCacheOptions) {
    if (!Number.isInteger(opts.capacity) || opts.capacity < 1) {
      throw new RangeError('capacity must be a positive integer');
    }
    this.now = opts.now ?? Date.now;
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // touch: přesun na konec
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  set(key: K, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.opts.ttlMs });
    while (this.entries.size > this.opts.capacity) {
      const oldest = this.entries.keys().next().value as K;
      this.entries.delete(oldest);
    }
  }

  delete(key: K): boolean {
    return this.entries.delete(key);
  }

  /**
   * Cache hit → hodnota. Miss → zavolá loader, ale souběžné missy na stejný
   * klíč sdílí JEDEN loader (singleflight). Chyba loaderu se necachuje.
   */
  getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return Promise.resolve(hit);

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const p = (async () => {
      try {
        const value = await loader();
        this.set(key, value);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }
}

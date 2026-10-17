export interface LruCacheOptions {
  capacity: number;
  ttlMs: number;
  /** Hodiny v ms — injektovatelné kvůli testům. */
  now?: () => number;
}

export class LruCache<K, V> {
  constructor(private readonly opts: LruCacheOptions) {
    // TODO: capacity < 1 → RangeError
  }

  get size(): number {
    throw new Error('TODO');
  }

  get(key: K): V | undefined {
    throw new Error('TODO');
  }

  has(key: K): boolean {
    throw new Error('TODO');
  }

  set(key: K, value: V): void {
    throw new Error('TODO');
  }

  delete(key: K): boolean {
    throw new Error('TODO');
  }

  getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
    throw new Error('TODO');
  }
}

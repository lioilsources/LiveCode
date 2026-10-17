// Exercise D3 — viz README.md v tomto adresáři.

export interface RetryOptions {
  retries?: number; // počet opakování NAVÍC k prvnímu pokusu (default 3)
  baseMs?: number; // default 100
  maxMs?: number; // default 5000
  signal?: AbortSignal;
  shouldRetry?: (err: unknown) => boolean; // default () => true
}

export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  throw new Error('TODO');
}

export interface BatchOptions {
  concurrency: number;
  retries?: number; // default 0
  baseMs?: number; // default 100
  signal?: AbortSignal;
}

export interface BatchResult<T, R> {
  ok: Array<{ item: T; value: R }>;
  failed: Array<{ item: T; error: unknown }>;
}

export async function processBatch<T, R>(
  items: readonly T[],
  worker: (item: T, signal: AbortSignal) => Promise<R>,
  opts: BatchOptions,
): Promise<BatchResult<T, R>> {
  throw new Error('TODO');
}

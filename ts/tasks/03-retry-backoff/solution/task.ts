export interface RetryOptions {
  /** Kolik opakování PO prvním pokusu. Celkem pokusů = retries + 1. */
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  signal?: AbortSignal;
  /** Má se po této chybě opakovat? Default: vždy. `attempt` je 1-based. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Vrací [0, 1). Injektovatelný kvůli deterministickým testům. */
  random?: () => number;
}

/** Full jitter: random * min(max, base * 2^n), n = 0 pro první čekání. */
export function backoffDelay(n: number, base: number, max: number, random: () => number): number {
  return Math.floor(random() * Math.min(max, base * 2 ** n));
}

/** setTimeout jako Promise, který jde zrušit signálem (Go: select { case <-time.After: case <-ctx.Done(): }). */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort); // jinak listener leakuje
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retry<T>(
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const { retries, baseDelayMs, maxDelayMs, signal } = opts;
  const shouldRetry = opts.shouldRetry ?? (() => true);
  const random = opts.random ?? Math.random;

  for (let attempt = 1; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt, signal);
    } catch (err) {
      if (signal?.aborted) throw signal.reason; // zrušení vyhrává nad chybou fn
      if (attempt > retries || !shouldRetry(err, attempt)) throw err;
      await sleep(backoffDelay(attempt - 1, baseDelayMs, maxDelayMs, random), signal);
    }
  }
}

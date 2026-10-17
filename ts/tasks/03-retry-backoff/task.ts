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

/** Full jitter: floor(random * min(max, base * 2^n)), n = 0 pro první čekání. */
export function backoffDelay(n: number, base: number, max: number, random: () => number): number {
  throw new Error('TODO');
}

export async function retry<T>(
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  throw new Error('TODO');
}

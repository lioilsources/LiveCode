export const RATE_LIMIT_OPTIONS = Symbol('RATE_LIMIT_OPTIONS');

export interface RateLimitOptions {
  /** Max tokenů v kbelíku = povolený burst. */
  capacity: number;
  /** Kolik tokenů přibude za sekundu. */
  refillPerSec: number;
}

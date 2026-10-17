import { Injectable } from '@nestjs/common';

export type IdempotencyEntry =
  | { state: 'in_progress'; fingerprint: string }
  | { state: 'done'; fingerprint: string; body: unknown };

/**
 * In-memory úložiště. Produkce: Redis / tabulka s UNIQUE(key) a TTL (typicky 24 h);
 * „in_progress" zápis musí být atomický (SET NX / INSERT … ON CONFLICT DO NOTHING).
 */
@Injectable()
export class IdempotencyStore {
  private readonly entries = new Map<string, IdempotencyEntry>();

  get(key: string): IdempotencyEntry | undefined {
    return this.entries.get(key);
  }

  set(key: string, entry: IdempotencyEntry): void {
    this.entries.set(key, entry);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}

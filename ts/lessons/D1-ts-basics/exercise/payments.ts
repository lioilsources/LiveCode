export type Currency = 'CZK' | 'EUR' | 'USD';
export type FailureCode = 'card_declined' | 'insufficient_funds' | 'fraud_suspected';

/** Částky jsou v minor units (haléře / centy). */
export type PaymentEvent =
  | { kind: 'authorized'; paymentId: string; amount: number; currency: Currency }
  | { kind: 'captured'; paymentId: string; amount: number }
  | { kind: 'refunded'; paymentId: string; amount: number; reason?: string }
  | { kind: 'failed'; paymentId: string; code: FailureCode };

export type PaymentState =
  | { status: 'none' }
  | { status: 'authorized'; amount: number; currency: Currency }
  | { status: 'captured'; captured: number; refunded: number; currency: Currency }
  | { status: 'refunded'; amount: number; currency: Currency }
  | { status: 'failed'; code: FailureCode };

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: PaymentState['status'],
    public readonly event: PaymentEvent['kind'],
  ) {
    super(`invalid transition: ${from} -> ${event}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertNever(x: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(x)}`);
}

export function describe(e: PaymentEvent): string {
  throw new Error('TODO');
}

export function apply(state: PaymentState, e: PaymentEvent): PaymentState {
  throw new Error('TODO');
}

export function replay(events: PaymentEvent[]): Map<string, PaymentState> {
  throw new Error('TODO');
}

export function netAmount(state: PaymentState): number {
  throw new Error('TODO');
}

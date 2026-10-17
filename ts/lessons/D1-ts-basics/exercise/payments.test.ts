import {
  apply,
  describe as describeEvent,
  InvalidTransitionError,
  netAmount,
  replay,
  type PaymentEvent,
  type PaymentState,
} from './payments';

const auth: PaymentEvent = { kind: 'authorized', paymentId: 'p1', amount: 1250, currency: 'CZK' };
const capture: PaymentEvent = { kind: 'captured', paymentId: 'p1', amount: 1250 };

describe('describe', () => {
  it.each<[PaymentEvent, string]>([
    [auth, 'authorized 12.50 CZK'],
    [capture, 'captured 12.50'],
    [{ kind: 'refunded', paymentId: 'p1', amount: 500, reason: 'customer request' }, 'refunded 5.00 (customer request)'],
    [{ kind: 'refunded', paymentId: 'p1', amount: 500 }, 'refunded 5.00'],
    [{ kind: 'failed', paymentId: 'p1', code: 'card_declined' }, 'failed: card_declined'],
  ])('%j → %s', (e, want) => expect(describeEvent(e)).toBe(want));
});

describe('apply', () => {
  const none: PaymentState = { status: 'none' };

  it('happy path: authorize → capture → partial refund → full refund', () => {
    let s = apply(none, auth);
    expect(s).toEqual({ status: 'authorized', amount: 1250, currency: 'CZK' });
    s = apply(s, capture);
    expect(s).toEqual({ status: 'captured', captured: 1250, refunded: 0, currency: 'CZK' });
    s = apply(s, { kind: 'refunded', paymentId: 'p1', amount: 250 });
    expect(s).toEqual({ status: 'captured', captured: 1250, refunded: 250, currency: 'CZK' });
    s = apply(s, { kind: 'refunded', paymentId: 'p1', amount: 1000 });
    expect(s).toEqual({ status: 'refunded', amount: 1250, currency: 'CZK' });
  });

  it('partial capture', () => {
    const s = apply(apply(none, auth), { kind: 'captured', paymentId: 'p1', amount: 1000 });
    expect(s).toMatchObject({ status: 'captured', captured: 1000 });
  });

  it('failed z none i z authorized', () => {
    const f: PaymentEvent = { kind: 'failed', paymentId: 'p1', code: 'fraud_suspected' };
    expect(apply(none, f)).toEqual({ status: 'failed', code: 'fraud_suspected' });
    expect(apply(apply(none, auth), f)).toEqual({ status: 'failed', code: 'fraud_suspected' });
  });

  it('neplatné přechody hází InvalidTransitionError', () => {
    expect(() => apply(none, capture)).toThrow(InvalidTransitionError);
    const captured = apply(apply(none, auth), capture);
    expect(() => apply(captured, auth)).toThrow('invalid transition: captured -> authorized');
    let err: unknown;
    try {
      apply(captured, { kind: 'failed', paymentId: 'p1', code: 'card_declined' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(InvalidTransitionError);
    expect((err as InvalidTransitionError).name).toBe('InvalidTransitionError');
    expect((err as InvalidTransitionError).from).toBe('captured');
  });

  it('capture nad autorizovanou částku a refund nad captured hází', () => {
    const authorized = apply(none, auth);
    expect(() => apply(authorized, { kind: 'captured', paymentId: 'p1', amount: 1251 })).toThrow(InvalidTransitionError);
    const captured = apply(authorized, capture);
    expect(() => apply(captured, { kind: 'refunded', paymentId: 'p1', amount: 1251 })).toThrow(InvalidTransitionError);
  });

  it('nemutuje vstup', () => {
    const authorized = apply(none, auth);
    const captured = apply(authorized, capture);
    const snapshot = structuredClone(captured);
    apply(captured, { kind: 'refunded', paymentId: 'p1', amount: 100 });
    expect(captured).toEqual(snapshot);
    expect(authorized).toEqual({ status: 'authorized', amount: 1250, currency: 'CZK' });
  });
});

describe('replay + netAmount', () => {
  const events: PaymentEvent[] = [
    { kind: 'authorized', paymentId: 'a', amount: 1000, currency: 'EUR' },
    { kind: 'authorized', paymentId: 'b', amount: 500, currency: 'USD' },
    { kind: 'captured', paymentId: 'a', amount: 1000 },
    { kind: 'failed', paymentId: 'b', code: 'insufficient_funds' },
    { kind: 'refunded', paymentId: 'a', amount: 300 },
  ];

  it('replay seskupí podle paymentId', () => {
    const states = replay(events);
    expect(states.size).toBe(2);
    expect(states.get('a')).toEqual({ status: 'captured', captured: 1000, refunded: 300, currency: 'EUR' });
    expect(states.get('b')).toEqual({ status: 'failed', code: 'insufficient_funds' });
  });

  it('netAmount', () => {
    const states = replay(events);
    expect(netAmount(states.get('a')!)).toBe(700);
    expect(netAmount(states.get('b')!)).toBe(0);
    expect(netAmount({ status: 'none' })).toBe(0);
    expect(netAmount({ status: 'refunded', amount: 100, currency: 'CZK' })).toBe(0);
  });
});

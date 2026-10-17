import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PAYMENT_DELAY_MS, PaymentsService } from './payments.service';

describe('IdempotencyInterceptor (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let payments: PaymentsService;

  async function boot(delayMs: number) {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PAYMENT_DELAY_MS)
      .useValue(delayMs)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    http = app.getHttpServer();
    payments = app.get(PaymentsService);
  }

  const pay = (key: string | undefined, body: object) => {
    const r = request(http).post('/payments');
    return (key ? r.set('Idempotency-Key', key) : r).send(body);
  };

  afterEach(async () => {
    await app.close();
  });

  describe('sequential', () => {
    beforeEach(() => boot(0));

    it('first request runs the handler → 201', async () => {
      const res = await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      expect(res.body).toMatchObject({ amount: 1000, currency: 'CZK' });
      expect(res.headers['idempotent-replayed']).toBeUndefined();
      expect(payments.calls).toBe(1);
    });

    it('repeat with same key + body replays the stored response, handler NOT called again', async () => {
      const first = await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      const second = await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      expect(second.body).toEqual(first.body); // stejné id platby
      expect(second.headers['idempotent-replayed']).toBe('true');
      expect(payments.calls).toBe(1);
    });

    it('same body with different key order is the same request', async () => {
      const first = await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      const second = await pay('k1', { currency: 'CZK', amount: 1000 }).expect(201);
      expect(second.body.id).toBe(first.body.id);
      expect(payments.calls).toBe(1);
    });

    it('different keys are independent payments', async () => {
      const a = await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      const b = await pay('k2', { amount: 1000, currency: 'CZK' }).expect(201);
      expect(a.body.id).not.toBe(b.body.id);
      expect(payments.calls).toBe(2);
    });

    it('same key with a different body → 422', async () => {
      await pay('k1', { amount: 1000, currency: 'CZK' }).expect(201);
      await pay('k1', { amount: 9999, currency: 'CZK' }).expect(422);
      expect(payments.calls).toBe(1);
    });

    it('missing Idempotency-Key → 400 and handler not called', async () => {
      await pay(undefined, { amount: 1000, currency: 'CZK' }).expect(400);
      expect(payments.calls).toBe(0);
    });

    it('failed requests are not cached — retry with the same key runs again', async () => {
      await pay('k1', { amount: -5, currency: 'CZK' }).expect(400);
      await pay('k1', { amount: -5, currency: 'CZK' }).expect(400);
      expect(payments.calls).toBe(2);
    });

    it('after a failure the key can be used with a corrected body', async () => {
      await pay('k1', { amount: -5, currency: 'CZK' }).expect(400);
      await pay('k1', { amount: 500, currency: 'CZK' }).expect(201);
    });
  });

  describe('concurrent', () => {
    beforeEach(() => boot(50));

    it('second request while the first is in flight → 409, handler called once', async () => {
      const body = { amount: 1000, currency: 'CZK' };
      const [a, b] = await Promise.all([pay('k1', body), pay('k1', body)]);
      expect([a.status, b.status].sort()).toEqual([201, 409]);
      expect(payments.calls).toBe(1);

      // a po dokončení už replay
      const c = await pay('k1', body).expect(201);
      expect(c.headers['idempotent-replayed']).toBe('true');
    });
  });
});

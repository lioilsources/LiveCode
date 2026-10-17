import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { INITIAL_STOCK } from './inventory.service';

describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(INITIAL_STOCK)
      .useValue({ A: 10, B: 5 })
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    http = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const order = (items: unknown) => request(http).post('/orders').send({ items });
  const stockOf = async (sku: string) =>
    (await request(http).get(`/inventory/${sku}`).expect(200)).body.available as number;

  it('POST /orders reserves stock → 201', async () => {
    const res = await order([{ sku: 'A', qty: 3 }, { sku: 'B', qty: 2 }]).expect(201);
    expect(res.body).toMatchObject({ status: 'reserved', items: [{ sku: 'A', qty: 3 }, { sku: 'B', qty: 2 }] });
    expect(typeof res.body.id).toBe('string');
    expect(await stockOf('A')).toBe(7);
    expect(await stockOf('B')).toBe(3);
  });

  it('insufficient stock → 409 with shortages, nothing reserved', async () => {
    const res = await order([{ sku: 'A', qty: 3 }, { sku: 'B', qty: 6 }]).expect(409);
    expect(res.body).toMatchObject({
      statusCode: 409,
      error: 'InsufficientStockError',
      shortages: [{ sku: 'B', requested: 6, available: 5 }],
    });
    expect(await stockOf('A')).toBe(10);
    expect(await stockOf('B')).toBe(5);
  });

  it('duplicate SKUs are summed → 409 when the sum exceeds stock', async () => {
    const res = await order([{ sku: 'A', qty: 6 }, { sku: 'A', qty: 6 }]).expect(409);
    expect(res.body.shortages).toEqual([{ sku: 'A', requested: 12, available: 10 }]);
  });

  it('unknown SKU → 422', async () => {
    const res = await order([{ sku: 'NOPE', qty: 1 }]).expect(422);
    expect(res.body.error).toBe('UnknownSkuError');
    expect(await stockOf('A')).toBe(10);
  });

  it.each([
    ['no items field', undefined],
    ['empty items', []],
    ['items not an array', 'A'],
    ['qty 0', [{ sku: 'A', qty: 0 }]],
    ['qty not integer', [{ sku: 'A', qty: 1.5 }]],
    ['qty as string', [{ sku: 'A', qty: '2' }]],
    ['missing sku', [{ qty: 1 }]],
    ['empty sku', [{ sku: '', qty: 1 }]],
    ['unknown nested field', [{ sku: 'A', qty: 1, price: 5 }]],
  ])('validation: %s → 400', async (_name, items) => {
    await order(items).expect(400);
  });

  it('GET /orders/:id → 200, unknown → 404', async () => {
    const { body } = await order([{ sku: 'A', qty: 1 }]).expect(201);
    await request(http).get(`/orders/${body.id}`).expect(200, body);
    const res = await request(http).get('/orders/does-not-exist').expect(404);
    expect(res.body.error).toBe('OrderNotFoundError');
  });

  it('cancel returns stock, second cancel is a no-op → both 200', async () => {
    const { body } = await order([{ sku: 'A', qty: 4 }, { sku: 'B', qty: 5 }]).expect(201);
    expect(await stockOf('B')).toBe(0);

    const first = await request(http).post(`/orders/${body.id}/cancel`).expect(200);
    expect(first.body.status).toBe('cancelled');
    expect(await stockOf('A')).toBe(10);
    expect(await stockOf('B')).toBe(5);

    await request(http).post(`/orders/${body.id}/cancel`).expect(200);
    expect(await stockOf('A')).toBe(10);
    expect(await stockOf('B')).toBe(5);

    const after = await request(http).get(`/orders/${body.id}`).expect(200);
    expect(after.body.status).toBe('cancelled');
  });

  it('cancel unknown → 404', async () => {
    await request(http).post('/orders/nope/cancel').expect(404);
  });

  it('non-domain errors still go through Nest default handling', async () => {
    await request(http).get('/no-such-route').expect(404);
  });
});

import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './drill';

describe('drill 05 — interceptory', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('globální WrapInterceptor (APP_INTERCEPTOR) obalí výsledek do { data }', () =>
    request(app.getHttpServer()).get('/things').expect(200, { data: ['a', 'b'] }));

  it('WrapInterceptor funguje i pro async handler', () =>
    request(app.getHttpServer()).get('/things/async').expect(200, { data: { id: 1 } }));

  it('TimingInterceptor nastaví x-response-time ve tvaru "<n>ms"', async () => {
    const res = await request(app.getHttpServer()).get('/things').expect(200);
    expect(res.headers['x-response-time']).toMatch(/^\d+ms$/);
  });

  it('TimeoutInterceptor na /things/slow → 408', () =>
    request(app.getHttpServer()).get('/things/slow').expect(408));

  it('chyba z handleru propadne dál (404, bez obalu)', async () => {
    const res = await request(app.getHttpServer()).get('/things/missing').expect(404);
    expect(res.body.data).toBeUndefined();
  });
});

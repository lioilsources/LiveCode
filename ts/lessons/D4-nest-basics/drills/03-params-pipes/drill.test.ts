import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ItemsModule } from './drill';

describe('drill 03 — @Param, @Query, built-in pipes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // záměrně BEZ globálního ValidationPipe — konverzi musí udělat pipes na parametrech
    const mod = await Test.createTestingModule({ imports: [ItemsModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('GET /items/42 → id je number', () =>
    request(app.getHttpServer()).get('/items/42').expect(200, { id: 42, type: 'number' }));

  it('GET /items/abc → 400', () => request(app.getHttpServer()).get('/items/abc').expect(400));

  it('GET /items → limit default 10', () =>
    request(app.getHttpServer()).get('/items').expect(200, { limit: 10, q: null }));

  it('GET /items?limit=5&q=dune → limit 5 jako number, q string', () =>
    request(app.getHttpServer()).get('/items?limit=5&q=dune').expect(200, { limit: 5, q: 'dune' }));

  it('GET /items?limit=x → 400', () => request(app.getHttpServer()).get('/items?limit=x').expect(400));

  it('GET /items/stats → statická routa nesmí spadnout do :id', () =>
    request(app.getHttpServer()).get('/items/stats').expect(200, { count: 0 }));

  it('GET /items/echo-header vrací hlavičku x-request-id', () =>
    request(app.getHttpServer())
      .get('/items/echo-header')
      .set('X-Request-Id', 'abc-1')
      .expect(200, { requestId: 'abc-1' }));
});

import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './drill';

describe('drill 01 — middleware', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('přepošle příchozí x-request-id do odpovědi', () =>
    request(app.getHttpServer())
      .get('/ping')
      .set('x-request-id', 'abc-123')
      .expect(200, { pong: true })
      .expect('x-request-id', 'abc-123'));

  it('bez hlavičky vygeneruje UUID', async () => {
    const res = await request(app.getHttpServer()).get('/ping').expect(200);
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('dva requesty bez hlavičky → dvě různá id', async () => {
    const a = await request(app.getHttpServer()).get('/ping');
    const b = await request(app.getHttpServer()).get('/ping');
    expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
  });

  it('id je dostupné i handleru (req.requestId)', async () => {
    const res = await request(app.getHttpServer())
      .get('/ping/whoami')
      .set('x-request-id', 'xyz')
      .expect(200);
    expect(res.body).toEqual({ requestId: 'xyz' });
  });
});

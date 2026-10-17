import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthModule } from './drill';

describe('drill 01 — controller + module', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('GET /health → 200 {status:"ok"}', () =>
    request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' }));

  it('GET /health/version → 200 {version:"1.0.0"}', () =>
    request(app.getHttpServer()).get('/health/version').expect(200, { version: '1.0.0' }));

  it('POST /health/ping → 200 (ne 201!) {pong:true}', () =>
    request(app.getHttpServer()).post('/health/ping').expect(200, { pong: true }));
});

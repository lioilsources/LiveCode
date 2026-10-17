import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule, IS_PUBLIC_KEY } from './drill';

describe('drill 02 — ApiKeyGuard jako APP_GUARD + @Public()', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // guard musí být registrovaný v modulu (APP_GUARD) — test nic globálně nenastavuje
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('bez klíče → 401', () => request(app.getHttpServer()).get('/reports').expect(401));

  it('špatný klíč → 401', () =>
    request(app.getHttpServer()).get('/reports').set('x-api-key', 'nope').expect(401));

  it('správný klíč → 200', () =>
    request(app.getHttpServer())
      .get('/reports')
      .set('x-api-key', 'secret')
      .expect(200, { reports: [] }));

  it('@Public() na metodě → bez klíče 200', () =>
    request(app.getHttpServer()).get('/reports/health').expect(200, { ok: true }));

  it('@Public() na celém controlleru', () =>
    request(app.getHttpServer()).get('/docs').expect(200, { docs: 'here' }));

  it('IS_PUBLIC_KEY je exportovaný klíč metadat', () => {
    expect(typeof IS_PUBLIC_KEY).toBe('string');
  });
});

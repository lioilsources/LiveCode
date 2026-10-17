import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';

describe('D5 exercise — guard, @Public, @CurrentUser, envelope, filter', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  const alice = { 'x-api-key': 'key-alice' };
  const bob = { 'x-api-key': 'key-bob' };

  beforeEach(async () => {
    // jen AppModule — guard, interceptor i filter musí být registrované v něm (APP_*)
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterEach(() => app.close());

  describe('ApiKeyGuard + @Public', () => {
    it('bez klíče → 401', () => http().get('/projects').expect(401));
    it('neznámý klíč → 401', () => http().get('/projects').set('x-api-key', 'nope').expect(401));
    it('@Public controller projde bez klíče', () => http().get('/health').expect(200));
  });

  describe('@CurrentUser', () => {
    it('GET /me vrací uživatele podle klíče', async () => {
      const res = await http().get('/me').set(bob).expect(200);
      expect(res.body.data).toEqual({ id: 'u2', name: 'bob' });
    });

    it("@CurrentUser('id') — každý vidí jen svoje projekty", async () => {
      const a = await http().get('/projects').set(alice).expect(200);
      expect(a.body.data).toEqual([{ id: 'p1', name: 'Apollo', ownerId: 'u1' }]);
      const b = await http().get('/projects').set(bob).expect(200);
      expect(b.body.data).toEqual([{ id: 'p2', name: 'Gemini', ownerId: 'u2' }]);
    });

    it('POST /projects nastaví ownerId z přihlášeného uživatele', async () => {
      const res = await http().post('/projects').set(alice).send({ name: 'Artemis' }).expect(201);
      expect(res.body.data).toEqual({ id: 'p3', name: 'Artemis', ownerId: 'u1' });
    });
  });

  describe('ResponseEnvelopeInterceptor', () => {
    it('obalí úspěch do { data, meta: { durationMs } }', async () => {
      const res = await http().get('/health').expect(200);
      expect(res.body).toEqual({ data: { status: 'ok' }, meta: { durationMs: expect.any(Number) } });
      expect(res.body.meta.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('chyby NEobalí', async () => {
      const res = await http().get('/projects').expect(401);
      expect(res.body.data).toBeUndefined();
    });
  });

  describe('DomainErrorFilter', () => {
    it('NotFoundError → 404 { error: { code, message } }', () =>
      http()
        .get('/projects/p99')
        .set(alice)
        .expect(404, { error: { code: 'NOT_FOUND', message: 'project p99 not found' } }));

    it('AccessDeniedError → 403 { error: { code, message } }', () =>
      http()
        .get('/projects/p2')
        .set(alice)
        .expect(403, {
          error: { code: 'FORBIDDEN', message: 'project p2 belongs to someone else' },
        }));

    it('vlastní projekt → 200 v obálce', async () => {
      const res = await http().get('/projects/p1').set(alice).expect(200);
      expect(res.body.data).toEqual({ id: 'p1', name: 'Apollo', ownerId: 'u1' });
    });

    it('HttpException (401 z guardu) má dál defaultní Nest tvar', async () => {
      const res = await http().get('/projects').expect(401);
      expect(res.body.statusCode).toBe(401);
    });
  });
});

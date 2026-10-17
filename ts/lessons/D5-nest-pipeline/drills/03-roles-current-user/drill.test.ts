import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './drill';

describe('drill 03 — AuthGuard (401) + RolesGuard (403) + @CurrentUser()', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('bez tokenu → 401', () => http().get('/me').expect(401));
  it('špatné schéma → 401', () => http().get('/me').set('authorization', 'Basic alice').expect(401));
  it('neznámý uživatel → 401', () => http().get('/me').set('authorization', 'Bearer eve').expect(401));

  it('@CurrentUser() vrací celého uživatele', () =>
    http()
      .get('/me')
      .set('authorization', 'Bearer bob')
      .expect(200, { name: 'bob', roles: ['user'] }));

  it("@CurrentUser('name') vrací jen pole", () =>
    http().get('/me/name').set('authorization', 'Bearer bob').expect(200, { name: 'bob' }));

  it('přihlášený bez role admin → 403', () =>
    http().delete('/admin/users/1').set('authorization', 'Bearer bob').expect(403));

  it('admin → 204', () =>
    http().delete('/admin/users/1').set('authorization', 'Bearer alice').expect(204));

  it('nepřihlášený na admin routu → 401 (ne 403)', () =>
    http().delete('/admin/users/1').expect(401));
});

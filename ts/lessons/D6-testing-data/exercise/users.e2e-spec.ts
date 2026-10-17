import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { setupApp } from './setup-app';
import { User } from './user';
import { UsersModule } from './users.module';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [UsersModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();

    // 12 uživatelů: id 1..12, každý třetí (3, 6, 9, 12) je admin
    for (let i = 1; i <= 12; i++) {
      await http()
        .post('/users')
        .send({ name: `user-${i}`, email: `user${i}@x.cz`, role: i % 3 === 0 ? 'admin' : 'member' })
        .expect(201);
    }
  });

  afterAll(() => app.close());

  describe('GET /users', () => {
    it('default: page=1, limit=10', async () => {
      const res = await http().get('/users').expect(200);
      expect(res.body).toMatchObject({ total: 12, page: 1, limit: 10 });
      expect(res.body.items).toHaveLength(10);
      expect(res.body.items[0]).toEqual({ id: 1, name: 'user-1', email: 'user1@x.cz', role: 'member' });
    });

    it('druhá stránka', async () => {
      const res = await http().get('/users?page=2').expect(200);
      expect(res.body.items.map((u: User) => u.id)).toEqual([11, 12]);
    });

    it('filtr podle role + stránkování', async () => {
      const res = await http().get('/users').query({ role: 'admin', limit: 2, page: 2 }).expect(200);
      expect(res.body).toMatchObject({ total: 4, page: 2, limit: 2 });
      expect(res.body.items.map((u: User) => u.id)).toEqual([9, 12]);
    });

    it('stránka za koncem → prázdné items, ne 404', async () => {
      const res = await http().get('/users?page=50').expect(200);
      expect(res.body).toMatchObject({ items: [], total: 12, page: 50 });
    });

    it.each(['page=0', 'page=abc', 'limit=0', 'limit=101', 'role=root', 'sort=name'])('?%s → 400', (qs) =>
      http().get(`/users?${qs}`).expect(400),
    );
  });

  describe('GET /users/:id', () => {
    it('200', async () => {
      const res = await http().get('/users/3').expect(200);
      expect(res.body).toMatchObject({ id: 3, role: 'admin' });
    });
    it('404', () => http().get('/users/999').expect(404));
    it('400 pro ne-číslo', () => http().get('/users/abc').expect(400));
  });

  describe('POST /users', () => {
    it('201 a vrátí uživatele s id', async () => {
      const res = await http().post('/users').send({ name: 'Eva', email: 'Eva@Y.cz', role: 'member' }).expect(201);
      expect(res.body).toEqual({ id: expect.any(Number), name: 'Eva', email: 'eva@y.cz', role: 'member' });
    });

    it('duplicitní email (jiná velikost písmen) → 409', () =>
      http().post('/users').send({ name: 'Dup', email: 'USER1@x.cz', role: 'member' }).expect(409));

    it.each([
      [{ email: 'a@x.cz', role: 'member' }, 'chybí name'],
      [{ name: 'A', email: 'not-an-email', role: 'member' }, 'špatný email'],
      [{ name: 'A', email: 'a@x.cz', role: 'root' }, 'neznámá role'],
      [{ name: 'A', email: 'a@x.cz', role: 'member', isAdmin: true }, 'neznámé pole'],
    ])('%j → 400 (%s)', (body, _why) => http().post('/users').send(body).expect(400));
  });
});

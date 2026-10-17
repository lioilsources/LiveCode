import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;

  // Nová aplikace pro každý test → čistý in-memory stav.
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    http = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const create = (body: object) => request(http).post('/tasks').send(body);

  describe('POST /tasks', () => {
    it('creates a task with defaults → 201', async () => {
      const res = await create({ title: 'Write tests' }).expect(201);
      expect(res.body).toMatchObject({ title: 'Write tests', status: 'todo' });
      expect(res.body.id).toMatch(UUID_RE);
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('accepts explicit status and description', async () => {
      const res = await create({ title: 'A', description: 'd', status: 'in_progress' }).expect(201);
      expect(res.body).toMatchObject({ title: 'A', description: 'd', status: 'in_progress' });
    });

    it.each([
      ['missing title', {}],
      ['empty title', { title: '' }],
      ['title too long', { title: 'x'.repeat(201) }],
      ['title not a string', { title: 42 }],
      ['unknown status', { title: 'A', status: 'nope' }],
      ['unknown field', { title: 'A', isAdmin: true }],
    ])('rejects %s → 400', async (_name, body) => {
      await create(body).expect(400);
    });

    it('accepts title of exactly 200 chars', async () => {
      await create({ title: 'x'.repeat(200) }).expect(201);
    });
  });

  describe('GET /tasks', () => {
    it('returns empty list initially', async () => {
      await request(http).get('/tasks').expect(200, []);
    });

    it('lists tasks and filters by ?status', async () => {
      await create({ title: 'a' }).expect(201);
      await create({ title: 'b', status: 'done' }).expect(201);
      await create({ title: 'c', status: 'done' }).expect(201);

      const all = await request(http).get('/tasks').expect(200);
      expect(all.body).toHaveLength(3);

      const done = await request(http).get('/tasks').query({ status: 'done' }).expect(200);
      expect(done.body.map((t: { title: string }) => t.title).sort()).toEqual(['b', 'c']);
    });

    it('rejects invalid ?status → 400', async () => {
      await request(http).get('/tasks?status=bogus').expect(400);
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns the task', async () => {
      const { body } = await create({ title: 'a' }).expect(201);
      const res = await request(http).get(`/tasks/${body.id}`).expect(200);
      expect(res.body).toEqual(body);
    });

    it('unknown id → 404', async () => {
      await request(http).get(`/tasks/${MISSING_ID}`).expect(404);
    });

    it('malformed id → 400', async () => {
      await request(http).get('/tasks/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('updates only the sent fields', async () => {
      const { body } = await create({ title: 'keep me', description: 'd' }).expect(201);
      const res = await request(http).patch(`/tasks/${body.id}`).send({ status: 'done' }).expect(200);
      expect(res.body).toMatchObject({ id: body.id, title: 'keep me', description: 'd', status: 'done' });

      const again = await request(http).get(`/tasks/${body.id}`).expect(200);
      expect(again.body.status).toBe('done');
    });

    it('validates the patch → 400', async () => {
      const { body } = await create({ title: 'a' }).expect(201);
      await request(http).patch(`/tasks/${body.id}`).send({ status: 'nope' }).expect(400);
      await request(http).patch(`/tasks/${body.id}`).send({ title: '' }).expect(400);
    });

    it('ignores null in patch (title stays)', async () => {
      const { body } = await create({ title: 'keep me' }).expect(201);
      const res = await request(http).patch(`/tasks/${body.id}`).send({ title: null }).expect(200);
      expect(res.body.title).toBe('keep me');
    });

    it('unknown id → 404', async () => {
      await request(http).patch(`/tasks/${MISSING_ID}`).send({ status: 'done' }).expect(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes → 204 with empty body, then 404', async () => {
      const { body } = await create({ title: 'a' }).expect(201);
      const res = await request(http).delete(`/tasks/${body.id}`).expect(204);
      expect(res.text).toBe('');
      await request(http).get(`/tasks/${body.id}`).expect(404);
      await request(http).delete(`/tasks/${body.id}`).expect(404);
    });
  });
});

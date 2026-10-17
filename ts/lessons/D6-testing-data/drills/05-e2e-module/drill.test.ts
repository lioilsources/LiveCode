import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { NotesModule, setupApp } from './drill';

describe('NotesModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [NotesModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /notes → 201 s id', async () => {
    const res = await request(app.getHttpServer()).post('/notes').send({ title: 'buy milk' }).expect(201);
    expect(res.body).toEqual({ id: expect.any(Number), title: 'buy milk' });
  });

  it('GET /notes/:id → 200', async () => {
    const created = await request(app.getHttpServer()).post('/notes').send({ title: 'call mom' });
    const res = await request(app.getHttpServer()).get(`/notes/${created.body.id}`).expect(200);
    expect(res.body.title).toBe('call mom');
  });

  it('GET /notes/999 → 404', () => request(app.getHttpServer()).get('/notes/999').expect(404));
  it('GET /notes/abc → 400 (ParseIntPipe)', () => request(app.getHttpServer()).get('/notes/abc').expect(400));

  it.each([
    [{}, 'chybí title'],
    [{ title: '' }, 'prázdný title'],
    [{ title: 'x'.repeat(101) }, 'moc dlouhý'],
    [{ title: 'ok', admin: true }, 'neznámé pole (forbidNonWhitelisted)'],
  ])('POST %j → 400 (%s)', (body, _why) => request(app.getHttpServer()).post('/notes').send(body).expect(400));
});

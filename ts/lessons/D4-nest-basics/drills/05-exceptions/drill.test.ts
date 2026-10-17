import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { NotesModule } from './drill';

describe('drill 05 — HttpException → status kódy', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [NotesModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('celý životní cyklus poznámky', async () => {
    const http = request(app.getHttpServer());

    await http.get('/notes/hello').expect(404);

    await http
      .post('/notes')
      .send({ slug: 'hello', text: 'world' })
      .expect(201, { slug: 'hello', text: 'world' });

    await http.post('/notes').send({ slug: 'hello', text: 'again' }).expect(409);

    await http.get('/notes/hello').expect(200, { slug: 'hello', text: 'world' });

    await http.delete('/notes/hello').expect(204);
    await http.delete('/notes/hello').expect(404);
  });

  it('404 má zprávu se slugem', async () => {
    const res = await request(app.getHttpServer()).get('/notes/missing').expect(404);
    expect(res.body.message).toBe('note missing not found');
  });

  it('prázdný text → 400 (validace ručně v service, bez DTO)', () =>
    request(app.getHttpServer()).post('/notes').send({ slug: 'x', text: '' }).expect(400));
});

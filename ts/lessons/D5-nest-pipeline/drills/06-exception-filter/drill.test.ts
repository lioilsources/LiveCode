import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule, ConflictError, NotFoundError } from './drill';

describe('drill 06 — doménové chyby + exception filter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('doménové chyby jsou obyčejné Error potomky', () => {
    const e = new NotFoundError('user', 7);
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe('user 7 not found');
    expect(new ConflictError('email taken')).toBeInstanceOf(Error);
  });

  it('NotFoundError → 404 v jednotném tvaru', () =>
    request(app.getHttpServer())
      .get('/users/7')
      .expect(404, { error: { code: 'NOT_FOUND', message: 'user 7 not found' } }));

  it('ConflictError → 409 v jednotném tvaru', () =>
    request(app.getHttpServer())
      .post('/users')
      .expect(409, { error: { code: 'CONFLICT', message: 'email taken' } }));

  it('HttpException se chová jako dřív (filter ji nechytá)', async () => {
    const res = await request(app.getHttpServer()).get('/users/bad-request').expect(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('úspěch beze změny', () =>
    request(app.getHttpServer()).get('/users/1').expect(200, { id: 1, name: 'olda' }));
});

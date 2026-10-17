import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateUserDto, UpdateUserDto, UsersModule } from './drill';

describe('drill 04 — DTO + ValidationPipe', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [UsersModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });
  afterAll(() => app.close());

  const valid = { email: 'olda@example.com', name: 'Olda' };

  it('validní vstup → 201 a handler dostal instanci DTO', () =>
    request(app.getHttpServer())
      .post('/users')
      .send({ ...valid, age: 40 })
      .expect(201, { ...valid, age: 40, isDto: true }));

  it('age je volitelný', () =>
    request(app.getHttpServer()).post('/users').send(valid).expect(201, { ...valid, isDto: true }));

  it.each([
    ['špatný email', { ...valid, email: 'nope' }],
    ['krátké jméno', { ...valid, name: 'O' }],
    ['dlouhé jméno', { ...valid, name: 'x'.repeat(51) }],
    ['záporný věk', { ...valid, age: -1 }],
    ['věk není int', { ...valid, age: 1.5 }],
    ['chybí email', { name: 'Olda' }],
    ['pole navíc', { ...valid, role: 'admin' }],
  ])('%s → 400', (_label, body) =>
    request(app.getHttpServer()).post('/users').send(body).expect(400));

  it('PATCH /users/7 — partial update, id jako number', () =>
    request(app.getHttpServer())
      .patch('/users/7')
      .send({ name: 'Oldřich' })
      .expect(200, { id: 7, name: 'Oldřich' }));

  it('PATCH validuje přítomná pole', () =>
    request(app.getHttpServer()).patch('/users/7').send({ email: 'nope' }).expect(400));

  it('DTO jsou třídy (ne interfaces)', () => {
    expect(typeof CreateUserDto).toBe('function');
    expect(typeof UpdateUserDto).toBe('function');
  });
});

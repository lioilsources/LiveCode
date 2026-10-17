import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CounterModule, CounterService } from './drill';

describe('drill 02 — service + DI', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [CounterModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('stav sdílí všechny requesty (singleton)', async () => {
    const http = request(app.getHttpServer());
    await http.get('/counter').expect(200, { value: 0 });
    await http.post('/counter/inc').expect(201, { value: 1 });
    await http.post('/counter/inc').expect(201, { value: 2 });
    await http.get('/counter').expect(200, { value: 2 });
  });

  it('controller deleguje na CounterService (stejná instance z containeru)', async () => {
    const svc = app.get(CounterService);
    svc.inc();
    await request(app.getHttpServer()).get('/counter').expect(200, { value: 3 });
  });
});

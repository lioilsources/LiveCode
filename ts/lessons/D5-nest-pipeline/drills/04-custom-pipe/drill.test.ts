import 'reflect-metadata';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule, ParsePositiveIntPipe, TrimLowerPipe } from './drill';

describe('drill 04 — custom pipes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  describe('ParsePositiveIntPipe (unit)', () => {
    const pipe = new ParsePositiveIntPipe();
    const meta = { type: 'param' as const, data: 'id' };

    it.each([
      ['1', 1],
      ['42', 42],
    ])('%s → %d', (input, out) => expect(pipe.transform(input, meta)).toBe(out));

    it.each(['0', '-3', '1.5', 'abc', ''])('%j → BadRequestException', (input) => {
      expect(() => pipe.transform(input, meta)).toThrow(BadRequestException);
    });

    it('zpráva obsahuje jméno parametru', () => {
      expect(() => pipe.transform('x', meta)).toThrow('id must be a positive integer');
    });
  });

  it('TrimLowerPipe (unit)', () => {
    expect(new TrimLowerPipe().transform('  HeLLo ', { type: 'query' })).toBe('hello');
  });

  it('GET /orders/7 → id jako number', () =>
    request(app.getHttpServer()).get('/orders/7').expect(200, { id: 7 }));

  it('GET /orders/0 → 400 se zprávou', async () => {
    const res = await request(app.getHttpServer()).get('/orders/0').expect(400);
    expect(res.body.message).toBe('id must be a positive integer');
  });

  it('GET /orders?status=%20PAID%20 → normalizovaný status', () =>
    request(app.getHttpServer()).get('/orders?status=%20PAID%20').expect(200, { status: 'paid' }));
});

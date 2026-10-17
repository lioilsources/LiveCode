import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { Clock } from './clock';
import { RATE_LIMIT_OPTIONS } from './rate-limit.options';

class FakeClock extends Clock {
  t = 1_000_000;
  now(): number {
    return this.t;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

describe('RateLimitGuard (e2e)', () => {
  let app: INestApplication;
  let clock: FakeClock;
  let http: ReturnType<INestApplication['getHttpServer']>;

  const ping = (key?: string) => {
    const r = request(http).get('/ping');
    return key ? r.set('x-api-key', key) : r;
  };

  beforeEach(async () => {
    clock = new FakeClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Clock)
      .useValue(clock)
      .overrideProvider(RATE_LIMIT_OPTIONS)
      .useValue({ capacity: 3, refillPerSec: 0.5 }) // 1 token za 2 s
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    http = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('missing api key → 401', async () => {
    await ping().expect(401);
  });

  it('allows a burst up to capacity, then 429 with Retry-After', async () => {
    await ping('k1').expect(200, { pong: true });
    await ping('k1').expect(200);
    await ping('k1').expect(200);

    const res = await ping('k1').expect(429);
    expect(res.headers['retry-after']).toBe('2');
  });

  it('refills over time (lazy, based on the clock)', async () => {
    for (let i = 0; i < 3; i++) await ping('k1').expect(200);
    await ping('k1').expect(429);

    clock.advance(1_000); // půl tokenu — pořád málo
    const res = await ping('k1').expect(429);
    expect(res.headers['retry-after']).toBe('1');

    clock.advance(1_000); // celý token
    await ping('k1').expect(200);
    await ping('k1').expect(429);
  });

  it('never refills above capacity', async () => {
    clock.advance(60 * 60 * 1000);
    for (let i = 0; i < 3; i++) await ping('k1').expect(200);
    await ping('k1').expect(429);
  });

  it('buckets are per api key', async () => {
    for (let i = 0; i < 3; i++) await ping('k1').expect(200);
    await ping('k1').expect(429);
    await ping('k2').expect(200);
  });

  it('rejected requests do not consume tokens', async () => {
    for (let i = 0; i < 3; i++) await ping('k1').expect(200);
    for (let i = 0; i < 5; i++) await ping('k1').expect(429);
    clock.advance(2_000);
    await ping('k1').expect(200);
  });

  it('unguarded routes are not limited', async () => {
    for (let i = 0; i < 10; i++) await request(http).get('/health').expect(200);
  });
});

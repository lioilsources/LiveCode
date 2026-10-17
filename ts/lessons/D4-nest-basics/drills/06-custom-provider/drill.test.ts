import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GREETER, Greeter, GreetModule, PREFIX } from './drill';

describe('drill 06 — custom token + useClass/useValue/useFactory', () => {
  async function boot(override?: (b: ReturnType<typeof Test.createTestingModule>) => void) {
    const builder = Test.createTestingModule({ imports: [GreetModule] });
    override?.(builder);
    const app: INestApplication = (await builder.compile()).createNestApplication();
    await app.init();
    return app;
  }

  it('GET /greet/Olda → PoliteGreeter s PREFIX z useValue', async () => {
    const app = await boot();
    await request(app.getHttpServer()).get('/greet/Olda').expect(200, { text: 'Hello, Olda!' });
    await app.close();
  });

  it('GET /greet-loud/Olda → useFactory nad GREETER dělá uppercase', async () => {
    const app = await boot();
    await request(app.getHttpServer())
      .get('/greet-loud/Olda')
      .expect(200, { text: 'HELLO, OLDA!' });
    await app.close();
  });

  it('PREFIX jde přepsat → controller jde přes token, ne přes konkrétní třídu', async () => {
    const app = await boot((b) => b.overrideProvider(PREFIX).useValue('Ahoj'));
    await request(app.getHttpServer()).get('/greet/Olda').expect(200, { text: 'Ahoj, Olda!' });
    await app.close();
  });

  it('GREETER jde nahradit mockem', async () => {
    const fake: Greeter = { greet: (n) => `fake ${n}` };
    const app = await boot((b) => b.overrideProvider(GREETER).useValue(fake));
    await request(app.getHttpServer()).get('/greet/Olda').expect(200, { text: 'fake Olda' });
    await app.close();
  });

  it('GREETER je Symbol', () => {
    expect(typeof GREETER).toBe('symbol');
  });
});

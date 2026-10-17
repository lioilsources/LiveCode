// Example 02 — custom providers, tokeny, imports/exports mezi moduly.
//
//   npm run ex:nest lessons/D4-nest-basics/examples/02-custom-providers.ts
//
// Ukazuje: interface jako abstrakce + Symbol token + @Inject, useClass /
// useValue / useFactory (+inject) / useExisting, singleton scope, a co se
// stane, když modul zapomene provider exportovat.
import 'reflect-metadata';
import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// ── abstrakce: interface za běhu NEEXISTUJE → potřebujeme token ──────────
interface Clock {
  now(): string;
}
const CLOCK = Symbol('CLOCK');

class FixedClock implements Clock {
  now() {
    return '2026-10-17T10:00:00Z';
  }
}

// ── UsersModule: provider + export ─────────────────────────────────────────
@Injectable()
class UsersService {
  readonly createdAt = Math.random(); // poznáme, jestli je instance jedna
  name(id: number) {
    return `user-${id}`;
  }
}

@Module({ providers: [UsersService], exports: [UsersService] })
class UsersModule {}

// ── GreetingModule: konzument ──────────────────────────────────────────────
@Injectable()
class GreetingService {
  constructor(
    private readonly users: UsersService, //    token = třída (z metadat)
    @Inject(CLOCK) private readonly clock: Clock, // token = Symbol
    @Inject('APP_NAME') private readonly appName: string, // useValue
    @Inject('BANNER') private readonly banner: string, //   useFactory
    @Inject('TIME') private readonly alias: Clock, //       useExisting
  ) {}

  greet(id: number) {
    return {
      text: `${this.banner}: hello ${this.users.name(id)}`,
      at: this.clock.now(),
      sameClock: this.alias === this.clock,
      usersInstance: this.users.createdAt,
      app: this.appName,
    };
  }
}

@Controller('greet')
class GreetingController {
  constructor(
    private readonly greeting: GreetingService,
    private readonly users: UsersService,
  ) {}

  @Get()
  get() {
    return {
      ...this.greeting.greet(7),
      // stejná instance UsersService v controlleru i v GreetingService?
      controllerUsersInstance: this.users.createdAt,
    };
  }
}

@Module({
  imports: [UsersModule], // bez tohohle: "Nest can't resolve dependencies..."
  controllers: [GreetingController],
  providers: [
    GreetingService,
    { provide: CLOCK, useClass: FixedClock },
    { provide: 'APP_NAME', useValue: 'bookstore' },
    {
      provide: 'BANNER',
      useFactory: (app: string) => app.toUpperCase(),
      inject: ['APP_NAME'],
    },
    { provide: 'TIME', useExisting: CLOCK },
  ],
})
class GreetingModule {}

// ── rozbitá varianta: UsersModule nic neexportuje ──────────────────────────
@Module({ providers: [UsersService] })
class UsersModuleNoExport {}

@Module({ imports: [UsersModuleNoExport], providers: [GreetingService] })
class BrokenModule {}

async function main() {
  const app = await NestFactory.create(GreetingModule, { logger: false });
  await app.listen(0);
  const res = await fetch((await app.getUrl()) + '/greet');
  const body = (await res.json()) as Record<string, unknown>;
  console.log(res.status, body);
  console.log('singleton?', body.usersInstance === body.controllerUsersInstance);
  await app.close();

  try {
    await NestFactory.create(BrokenModule, { logger: false, abortOnError: false });
  } catch (e) {
    console.log('\nBrokenModule:', (e as Error).message.split('\n').slice(0, 3).join('\n'));
  }
}

main();

/* Výstup (čísla instancí se liší, důležité je true):
200 {
  text: 'BOOKSTORE: hello user-7',
  at: '2026-10-17T10:00:00Z',
  sameClock: true,
  usersInstance: 0.53...,
  app: 'bookstore',
  controllerUsersInstance: 0.53...
}
singleton? true

BrokenModule: Nest can't resolve dependencies of the GreetingService (?, Symbol(CLOCK), APP_NAME, BANNER, TIME). Please make sure that the argument UsersService at index [0] is available in the BrokenModule module.
...
*/

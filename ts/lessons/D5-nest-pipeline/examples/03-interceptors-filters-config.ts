// Example 03 — interceptory (envelope + timing, timeout), doménový exception
// filter, config přes factory provider z process.env, lifecycle hooks.
//
//   API_KEY=dev npm run ex:nest lessons/D5-nest-pipeline/examples/03-interceptors-filters-config.ts
//   (bez API_KEY si example nastaví default; v reálu by start spadl)
import 'reflect-metadata';
import {
  ArgumentsHost, CallHandler, Catch, Controller, ExceptionFilter, ExecutionContext, Get, Global,
  Inject, Injectable, Module, NestInterceptor, OnApplicationShutdown, OnModuleDestroy,
  OnModuleInit, Param, RequestTimeoutException, UseInterceptors,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, NestFactory } from '@nestjs/core';
import type { Response } from 'express';
import { catchError, map, Observable, throwError, timeout, TimeoutError } from 'rxjs';

// ── config: process.env čtený na JEDNOM místě, validovaný při startu ────────
interface AppConfig {
  apiKey: string;
  slowMs: number;
}
const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error('API_KEY is required'); // fail fast při startu
        return { apiKey, slowMs: Number(process.env.SLOW_MS ?? 200) };
      },
    },
  ],
  exports: [APP_CONFIG],
})
class ConfigModule {}

// ── doména: žádný import z @nestjs ─────────────────────────────────────────
class NotFoundError extends Error {
  constructor(
    readonly entity: string,
    readonly id: string,
  ) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
  }
}

@Injectable()
class CatsService implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
  private readonly cats = new Map<string, { id: string; name: string }>();

  constructor(@Inject(APP_CONFIG) readonly cfg: AppConfig) {}

  async onModuleInit() {
    await new Promise((r) => setTimeout(r, 10)); // "connect k DB" — Nest počká
    this.cats.set('1', { id: '1', name: 'Mourek' });
    console.log(`[hook] onModuleInit (apiKey=${this.cfg.apiKey})`);
  }
  onModuleDestroy() {
    console.log('[hook] onModuleDestroy');
  }
  onApplicationShutdown(signal?: string) {
    console.log(`[hook] onApplicationShutdown (signal=${signal ?? 'none — app.close()'})`);
  }

  get(id: string) {
    const cat = this.cats.get(id);
    if (!cat) throw new NotFoundError('cat', id);
    return cat;
  }
}

// ── interceptory ───────────────────────────────────────────────────────────
@Injectable()
class EnvelopeInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now();
    const res = ctx.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        const durationMs = Math.round(performance.now() - start);
        res.setHeader('x-response-time', `${durationMs}ms`);
        return { data, meta: { durationMs } };
      }),
    );
  }
}

@Injectable()
class TimeoutInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(100),
      catchError((err) =>
        throwError(() => (err instanceof TimeoutError ? new RequestTimeoutException() : err)),
      ),
    );
  }
}

// ── filter: doménová chyba → HTTP ──────────────────────────────────────────
@Catch(NotFoundError)
class DomainErrorFilter implements ExceptionFilter {
  catch(err: NotFoundError, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: err.message } });
  }
}

@Controller('cats')
class CatsController {
  constructor(
    private readonly cats: CatsService,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  @Get('slow')
  @UseInterceptors(TimeoutInterceptor)
  async slow() {
    await new Promise((r) => setTimeout(r, this.cfg.slowMs));
    console.log('[slow] handler doběhl i po timeoutu — nikdo ho nezastavil');
    return 'done';
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cats.get(id);
  }
}

@Module({
  imports: [ConfigModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
class AppModule {}

async function main() {
  process.env.API_KEY ??= 'example-default'; // jen pro example; bez něj start spadne
  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableShutdownHooks(); // SIGTERM/SIGINT → app.close() → hooky
  await app.listen(0);
  const base = await app.getUrl();

  for (const path of ['/cats/1', '/cats/42', '/cats/slow']) {
    const res = await fetch(base + path);
    const rt = res.headers.get('x-response-time');
    console.log(`GET ${path.padEnd(10)} → ${res.status} ${await res.text()}${rt ? `  [x-response-time: ${rt}]` : ''}`);
  }

  await new Promise((r) => setTimeout(r, 200)); // necháme slow handler doběhnout
  await app.close();
}

main();

/* Výstup (časy se liší):
[hook] onModuleInit (apiKey=example-default)
GET /cats/1    → 200 {"data":{"id":"1","name":"Mourek"},"meta":{"durationMs":0}}  [x-response-time: 0ms]
GET /cats/42   → 404 {"error":{"code":"NOT_FOUND","message":"cat 42 not found"}}
GET /cats/slow → 408 {"message":"Request Timeout","statusCode":408}
[slow] handler doběhl i po timeoutu — nikdo ho nezastavil
[hook] onModuleDestroy
[hook] onApplicationShutdown (signal=none — app.close())

Všimni si:
- 404 nemá envelope: výjimka přeskočí `map` v interceptoru a jde rovnou do filtru,
- 408 přišel po 100 ms, ale handler běžel dál (JS nemá preemptivní zrušení),
- onModuleInit je async a Nest na něj počkal před listen.
*/

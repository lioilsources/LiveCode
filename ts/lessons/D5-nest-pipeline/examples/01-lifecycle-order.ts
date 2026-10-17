// Example 01 — pořadí request pipeline, změřené logem.
//
//   npm run ex:nest lessons/D5-nest-pipeline/examples/01-lifecycle-order.ts
//
// Každá vrstva zapíše do logu, kdy běží. Tři requesty:
//   1) projde vším        2) handler hodí výjimku        3) guard odmítne
import 'reflect-metadata';
import {
  ArgumentMetadata, ArgumentsHost, CallHandler, CanActivate, Catch, Controller,
  ExceptionFilter, ExecutionContext, Get, HttpException, Injectable, MiddlewareConsumer,
  Module, NestInterceptor, NestMiddleware, Param, PipeTransform, UseFilters, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { APP_INTERCEPTOR, NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

const log: string[] = [];

@Injectable()
class LogMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    log.push(`1 middleware        (${req.method} ${req.originalUrl})`);
    next();
  }
}

@Injectable()
class LogGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    // guard už ví, KTERÝ handler poběží:
    log.push(`2 guard             (handler=${ctx.getClass().name}.${ctx.getHandler().name})`);
    return req.header('x-allow') !== 'no'; // false → 403
  }
}

function namedInterceptor(name: string) {
  @Injectable()
  class Named implements NestInterceptor {
    intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
      log.push(`3 interceptor ${name} před`);
      return next.handle().pipe(tap(() => log.push(`6 interceptor ${name} po`)));
    }
  }
  return Named;
}
const GlobalInterceptor = namedInterceptor('global');
const RouteInterceptor = namedInterceptor('route ');

@Injectable()
class LogPipe implements PipeTransform {
  transform(value: unknown, meta: ArgumentMetadata) {
    log.push(`4 pipe              (${meta.type} '${meta.data}' = ${JSON.stringify(value)})`);
    return value;
  }
}

@Catch(HttpException)
class LogFilter implements ExceptionFilter {
  catch(err: HttpException, host: ArgumentsHost) {
    log.push(`7 filter            (${err.getStatus()} ${err.message})`);
    host.switchToHttp().getResponse<Response>().status(err.getStatus()).json({ caught: true });
  }
}

@Controller('cats')
@UseGuards(LogGuard)
@UseFilters(LogFilter)
class CatsController {
  @Get(':id')
  @UseInterceptors(RouteInterceptor)
  get(@Param('id', LogPipe) id: string) {
    log.push('5 handler');
    if (id === 'bad') throw new HttpException('cat is bad', 418);
    return { id };
  }
}

@Module({
  controllers: [CatsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: GlobalInterceptor }],
})
class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes(CatsController);
  }
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0);
  const base = await app.getUrl();

  for (const [path, headers] of [
    ['/cats/1', {}],
    ['/cats/bad', {}],
    ['/cats/1', { 'x-allow': 'no' }],
  ] as const) {
    log.length = 0;
    const res = await fetch(base + path, { headers });
    console.log(`\nGET ${path} ${JSON.stringify(headers)} → ${res.status} ${await res.text()}`);
    for (const line of log) console.log('   ' + line);
  }
  await app.close();
}

main();

/* Výstup:

GET /cats/1 {} → 200 {"id":"1"}
   1 middleware        (GET /cats/1)
   2 guard             (handler=CatsController.get)
   3 interceptor global před
   3 interceptor route  před
   4 pipe              (param 'id' = "1")
   5 handler
   6 interceptor route  po
   6 interceptor global po

GET /cats/bad {} → 418 {"caught":true}
   1 middleware        (GET /cats/bad)
   2 guard             (handler=CatsController.get)
   3 interceptor global před
   3 interceptor route  před
   4 pipe              (param 'id' = "bad")
   5 handler
   7 filter            (418 cat is bad)

GET /cats/1 {"x-allow":"no"} → 403 {"caught":true}
   1 middleware        (GET /cats/1)
   2 guard             (handler=CatsController.get)
   7 filter            (403 Forbidden resource)

Všimni si:
- interceptory "po" jsou v OBRÁCENÉM pořadí (cibule),
- při výjimce "po" části neběží (tap reaguje jen na úspěch),
- guard s `false` → ForbiddenException → chytí ji i náš filter (filtry vidí výjimky z guardů),
- pipe ani handler po odmítnutí guardem vůbec neběží.
*/

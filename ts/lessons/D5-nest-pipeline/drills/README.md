# D5 drills — request pipeline do prstů

> Každý drill = prázdný `drill.ts` se zadáním + test. Piš bez koukání do
> LESSON.md. Dokud chybí exporty, test spadne na chybě typů — to je záměr.
> Po všech šesti obsah smaž a jeď znovu; cíl do 5 minut na drill.

```bash
npx jest lessons/D5-nest-pipeline/drills/02     # jeden
npx jest lessons/D5-nest-pipeline/drills        # všechny
```

| # | Drill | Sval |
|---|---|---|
| 01 | middleware | `NestMiddleware`, `next()`, `configure(consumer)` |
| 02 | auth-guard-public | `CanActivate`, `Reflector`, `SetMetadata`, `APP_GUARD` |
| 03 | roles-current-user | 401 vs 403, dva guardy za sebou, `createParamDecorator` |
| 04 | custom-pipe | `PipeTransform`, `ArgumentMetadata` |
| 05 | interceptor | `next.handle().pipe(map / tap / timeout / catchError)` |
| 06 | exception-filter | doménové chyby, `@Catch`, `ArgumentsHost` |

## 6 tvarů, které chceš mít v prstech

```ts
// 1) Middleware
@Injectable()
export class M implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) { /* ... */ next(); }
}
export class AppModule implements NestModule {
  configure(c: MiddlewareConsumer) { c.apply(M).forRoutes(XController); }
}

// 2) Guard + metadata
export const Public = () => SetMetadata('isPublic', true);
@Injectable()
export class G implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>('isPublic', [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!ok(req)) throw new UnauthorizedException();
    return true;
  }
}
providers: [{ provide: APP_GUARD, useClass: G }]

// 3) Param decorator
export const CurrentUser = createParamDecorator((field: string | undefined, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest().user;
  return field ? user?.[field] : user;
});

// 4) Pipe
@Injectable()
export class P implements PipeTransform<string, number> {
  transform(value: string, meta: ArgumentMetadata): number { /* throw BadRequestException */ }
}

// 5) Interceptor
@Injectable()
export class I implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    return next.handle().pipe(map((data) => ({ data, ms: Date.now() - start })));
  }
}

// 6) Filter
@Catch(DomainError)
export class F implements ExceptionFilter {
  catch(err: DomainError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(404).json({ error: err.message });
  }
}
```

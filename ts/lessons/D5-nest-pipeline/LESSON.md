# D5 — Nest request pipeline: middleware, guard, interceptor, pipe, filter

> V Go máš jeden nástroj: `func(http.Handler) http.Handler`. Auth, logování,
> timeout, recover — všechno je middleware a pořadí určuješ ty, jak je
> zabalíš. **Nest má pět různých nástrojů s pevným pořadím.** Každý vidí jiné
> informace a hodí se na něco jiného. Na pohovoru se ptají přesně na tohle:
> *„kam bys dal auth? a logování? a mapování chyb?"*

## Jak spouštět examples

```bash
cd ts
npm run ex:nest lessons/D5-nest-pipeline/examples/01-lifecycle-order.ts
```

(`ex:nest` = ts-node s decorator metadata — viz D4. `tsx` by rozbil DI.)

---

## 1. Request lifecycle — pořadí, které musíš umět nakreslit ⚠️

```
            request
               │
   ┌───────────▼───────────┐
   │ 1. MIDDLEWARE         │  Express (req, res, next) — neví, KTERÝ handler poběží
   └───────────┬───────────┘
   ┌───────────▼───────────┐
   │ 2. GUARDS             │  smí to projít? true / false / throw
   └───────────┬───────────┘        false → 403 Forbidden
   ┌───────────▼───────────┐
   │ 3. INTERCEPTORS (před)│  ┐  obalují handler jako "around" advice
   └───────────┬───────────┘  │
   ┌───────────▼───────────┐  │
   │ 4. PIPES              │  │  transformace + validace argumentů (@Body, @Param…)
   └───────────┬───────────┘  │
   ┌───────────▼───────────┐  │
   │ 5. HANDLER            │  │  metoda controlleru
   └───────────┬───────────┘  │
   ┌───────────▼───────────┐  │
   │ 6. INTERCEPTORS (po)  │  ┘  vidí návratovou hodnotu (rxjs Observable)
   └───────────┬───────────┘
               │      ✖ výjimka kdekoli v 2–6
               │      └──────────► ┌──────────────────────┐
               ▼                   │ 7. EXCEPTION FILTERS │ → odpověď s chybou
            response               └──────────────────────┘
```

Zkratka: **M → G → I → P → H → I → F** (interceptor je tam dvakrát, protože obaluje).

V rámci jedné vrstvy: **global → controller → route** (guardy, interceptory,
pipes). U interceptorů po handleru je pořadí obrácené (cibule: kdo obalil
první, odchází poslední). U filtrů se hledá **nejbližší** (route → controller
→ global) a vyhraje první, který typ výjimky chytá.

> Věta na pohovor: **„Middleware neví, jaký handler poběží; guard už ano —
> má `ExecutionContext` a metadata handleru. Proto auth dělám v guardu, ne v
> middleware."**

## 2. Kdy co použít

| Nástroj | Vidí | Typické použití | Go analogie |
|---|---|---|---|
| **Middleware** | `req, res, next` (Express) | request-id, CORS, body parsing, access log, helmet | `func(http.Handler) http.Handler` |
| **Guard** | `ExecutionContext` = req + **který handler/controller** + metadata | autentizace, autorizace (role), feature flags, rate limit | middleware, který by znal route |
| **Interceptor** | `ExecutionContext` + **`Observable` výsledku** | logování s časem, transformace odpovědi (envelope), cache, timeout, mapování chyb | middleware s `ResponseRecorder` kolem `next.ServeHTTP` |
| **Pipe** | jeden argument + jeho metadata | validace DTO, `ParseIntPipe`, trim/normalizace | `strconv.Atoi` + `validate()` v handleru |
| **Exception filter** | výjimku + `ArgumentsHost` | jednotný tvar chyb, mapování doménových chyb na HTTP, logování 5xx | `recover()` middleware + `errors.As` mapování |

Rozhodovací pravidla:

1. **Má to rozhodnout „smí / nesmí"?** → guard.
2. **Potřebuješ výsledek handleru nebo čas jeho běhu?** → interceptor.
3. **Týká se to jednoho argumentu?** → pipe.
4. **Reaguješ na výjimku?** → filter.
5. **Nic z toho, a nepotřebuješ vědět, jaký handler poběží?** → middleware.

## 3. Middleware

```ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = req.header('x-request-id') ?? randomUUID();
    res.setHeader('x-request-id', id);
    next();                     // ⚠️ zapomeneš → request visí navždy
  }
}

@Module({ controllers: [CatsController] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)        // víc middleware = víc argumentů, v pořadí
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes(CatsController);        // nebo 'cats', nebo { path, method }
  }
}
```

- Middleware třída je provider → **má DI** (konstruktor).
- Registruje se v `configure()`, **ne** v `@Module({...})`.
- Funkční middleware: `app.use((req, res, next) => ...)` v `main.ts` — globální, bez DI.
- ⚠️ Nest 11 jede na Express 5: wildcard je `'{*splat}'`, ne `'*'`
  (staré `'*'` funguje s varováním). Na pohovoru stačí `forRoutes(Controller)`.

## 4. Guards — „vyhazovač u dveří"

**Analogie:** guard je **vyhazovač**. Vidí tvůj lísteček (hlavičky), ví, do
kterého sálu jdeš (handler + jeho metadata), a řekne ano/ne. Nezajímá ho, co
budeš uvnitř dělat.

```ts
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.header('x-api-key') !== 'secret') {
      throw new UnauthorizedException('invalid api key');   // 401
    }
    return true;
  }
}
// return false → Nest hodí ForbiddenException → 403
```

Použití:

```ts
@UseGuards(ApiKeyGuard)          // na controller nebo na metodu
@Controller('cats') ...
```

### 401 vs 403 — na tohle se ptají

| Kód | Znamená | Kdy |
|---|---|---|
| **401 Unauthorized** | „nevím, kdo jsi" (chybí / neplatný token) | `throw new UnauthorizedException()` |
| **403 Forbidden** | „vím, kdo jsi, ale tohle nesmíš" | `return false` nebo `throw new ForbiddenException()` |

Default `return false` dá **403** — pro chybějící token je to špatně. Proto
autentizační guard **hází 401** sám.

### Metadata + Reflector: `@Public()` a `@Roles()`

Guard ví, který handler poběží → může číst jeho **metadata**:

```ts
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),   // metoda má přednost...
      ctx.getClass(),     // ...před controllerem
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = parseBearer(req.header('authorization'));
    if (!user) throw new UnauthorizedException();
    req.user = user;      // ← pro @CurrentUser a další guardy
    return true;
  }
}
```

`getAllAndOverride` = vezmi první definovanou hodnotu (metoda, pak třída).
`getAllAndMerge` = slij pole z obou (role z controlleru + z metody).

Novější styl (Nest 10+): `Reflector.createDecorator<string[]>()` — typově
bezpečný dekorátor bez stringového klíče. `SetMetadata` uvidíš v 90 % kódu.

### Globální guard: `APP_GUARD` vs `useGlobalGuards`

```ts
// A) main.ts — instance vytvořená TEBOU, mimo DI container
app.useGlobalGuards(new AuthGuard(new Reflector()));   // závislosti ručně 😕

// B) provider v modulu — vytvoří CONTAINER, DI funguje ✅
@Module({ providers: [{ provide: APP_GUARD, useClass: AuthGuard }] })
export class AppModule {}
```

Totéž pro `APP_INTERCEPTOR`, `APP_PIPE`, `APP_FILTER`. **B je správně,**
kdykoli má globální věc závislosti (config, služby, Reflector). Bonus: B se
uplatní i v `Test.createTestingModule` — A musíš v testu zopakovat ručně.

> Věta na pohovor: **„`useGlobalGuards(new X())` obchází DI container — X nedostane
> závislosti a v testovacím modulu neexistuje. Globální guard registruju jako
> provider `APP_GUARD`."**

## 5. Custom param decorator: `@CurrentUser()`

Guard dal `req.user`. Handler ho nemá tahat z `@Req()` (to je Express únik):

```ts
export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as User;
    return field ? user?.[field] : user;
  },
);

@Get('me')
me(@CurrentUser() user: User) { return user; }

@Get('me/name')
name(@CurrentUser('name') name: string) { return { name }; }
```

Na `req.user` TS nadává (`Request` ho nemá). Buď `getRequest<Request & { user?: User }>()`,
nebo **module augmentation** `declare global { namespace Express { interface Request { user?: User } } }`.

## 6. Interceptors — „cibule kolem handleru"

Interceptor dostane `next: CallHandler`. `next.handle()` **spustí handler** a
vrátí `Observable` s jeho výsledkem. Co uděláš *před* `next.handle()`, běží
před handlerem; operátory na Observable běží *po*.

```ts
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();                          // PŘED handlerem
    const res = ctx.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      tap(() => res.setHeader('x-response-time', `${Date.now() - start}ms`)),  // PO
      map((data) => ({ data, meta: { durationMs: Date.now() - start } })),     // změň tělo
    );
  }
}
```

Nepotřebuješ umět RxJS. Stačí **pět operátorů**:

| Operátor | Co dělá | Použití |
|---|---|---|
| `map(fn)` | změní hodnotu | envelope `{ data }`, serializace |
| `tap(fn)` | side effect, hodnotu nemění | logování, metriky, hlavičky |
| `catchError(fn)` | chytí chybu, vrať `throwError(() => e2)` nebo náhradní hodnotu | mapování chyb |
| `timeout(ms)` | chyba `TimeoutError`, když handler trvá déle | request timeout |
| `of(x)` | Observable z hodnoty | cache hit — **nezavoláš `next.handle()`**, handler neběží |

```ts
// timeout interceptor — ekvivalent http.TimeoutHandler
return next.handle().pipe(
  timeout(5000),
  catchError((err) =>
    throwError(() => (err instanceof TimeoutError ? new RequestTimeoutException() : err)),
  ),
);
```

⚠️ Timeout **nezastaví** běžící handler (JS nemá preemptivní zrušení) —
jen klient dostane 408 dřív. Skutečné zrušení = `AbortSignal` předaný dolů (D3).
Stejně jako v Go: `http.TimeoutHandler` také nezabije goroutinu, jen
`ctx.Done()` jí dá vědět.

Vazba `@UseInterceptors(TimingInterceptor)` / `APP_INTERCEPTOR` — stejné jako guardy.

## 7. Custom pipe

Pipe = `transform(value, metadata)`; vrať novou hodnotu nebo hoď výjimku.

```ts
@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, meta: ArgumentMetadata): number {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(`${meta.data} must be a positive integer`);
    }
    return n;
  }
}

@Get(':id') get(@Param('id', ParsePositiveIntPipe) id: number) {}
```

`meta.type` = `'body' | 'query' | 'param' | 'custom'`, `meta.data` = jméno
(`'id'`), `meta.metatype` = typ z anotace (to používá `ValidationPipe`).

## 8. Exception filters — jednotný tvar chyb

Default filter umí jen `HttpException` (→ jeho status) a zbytek (→ 500).
Doménová vrstva ale nemá znát HTTP:

```ts
// doména — žádný import z @nestjs
export class NotFoundError extends Error {
  constructor(readonly entity: string, readonly id: string | number) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
  }
}

@Catch(NotFoundError)                       // které výjimky chytám
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: NotFoundError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
  }
}
```

- `@Catch(A, B)` — víc typů; `@Catch()` bez argumentu — **všechno** (catch-all,
  logování 500 + jednotný tvar).
- `ArgumentsHost` = obecný kontext (HTTP / RPC / WS). `ExecutionContext` je jeho
  potomek s `getHandler()/getClass()`.
- Filter **musí odpověď poslat sám** (`res.status().json()`); když nic nepošle,
  request visí.
- Rozšíření defaultu: `extends BaseExceptionFilter` a `super.catch(e, host)` pro
  výjimky, které nechceš řešit.
- Registrace: `@UseFilters()` / `APP_FILTER` / `app.useGlobalFilters()`.

Alternativa bez filtru: interceptor s `catchError`, který doménovou chybu
přemapuje na `NotFoundException`. Obojí je OK; filter je „ten pravý" Nest nástroj.

> Věta na pohovor: **„Service hází doménové chyby, které o HTTP nic nevědí;
> exception filter je mapuje na status kódy. Stejně jako v Go mapuju sentinel
> errors přes `errors.Is` v jednom místě v HTTP vrstvě."**

## 9. Konfigurace

V praxi `@nestjs/config`:

```ts
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })] })   // načte .env
// ...
constructor(private readonly config: ConfigService) {}
this.config.getOrThrow<string>('API_KEY');
```

Bez knihovny (a pro pochopení, co `ConfigModule` dělá) — **factory provider**:

```ts
export interface AppConfig { apiKey: string; port: number }
export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  providers: [{
    provide: APP_CONFIG,
    useFactory: (): AppConfig => {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error('API_KEY is required');   // fail fast při startu
      return { apiKey, port: Number(process.env.PORT ?? 3000) };
    },
  }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}

// kdekoli:
constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}
```

Pravidla jako v Go: **validuj config při startu** (ne při prvním requestu),
`process.env` čti **na jednom místě**, v testu přepiš provider
(`overrideProvider(APP_CONFIG).useValue({...})`) místo hraní si s `process.env`.

## 10. Lifecycle hooks & graceful shutdown

```
start:     constructor → onModuleInit() → onApplicationBootstrap() → listen
shutdown:  SIGTERM → onModuleDestroy() → beforeApplicationShutdown(signal)
                   → server.close() → onApplicationShutdown(signal)
```

```ts
@Injectable()
export class DbService implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() { await this.pool.connect(); }       // Nest počká
  async onApplicationShutdown(signal?: string) { await this.pool.end(); }
}

// main.ts
app.enableShutdownHooks();   // ⚠️ bez toho SIGTERM hooky NEZAVOLÁ
await app.listen(3000);
```

- `app.close()` zavolá shutdown hooky vždy; `enableShutdownHooks()` jen
  napojí OS signály (SIGTERM/SIGINT) na `app.close()`.
- Async hooky Nest **awaituje** — init DB před `listen`, uzavření poolu při stopu.
- In-flight requesty: `server.close()` přestane přijímat nové spojení a čeká
  na aktivní. Keep-alive spojení mohou čekání protáhnout → v Nest 11
  `NestFactory.create(App, { forceCloseConnections: true })`.

Go srovnání:

```go
srv := &http.Server{Addr: ":3000", Handler: mux}
go srv.ListenAndServe()
<-ctx.Done()                                   // signal.NotifyContext(SIGTERM)
shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
srv.Shutdown(shutdownCtx)                      // ≈ app.close()
db.Close()                                     // ≈ onApplicationShutdown
```

Rozdíl: v Go máš **deadline** na shutdown v ruce (`WithTimeout`). Nest žádný
default timeout nemá — v Kubernetes ho hlídá `terminationGracePeriodSeconds`.

## 11. Celý obrázek jedním příkladem

```ts
@Module({
  imports: [ConfigModule, CatsModule],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },              // 2. kdo jsi
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },// 3+6. čas + envelope
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) }, // 4.
    { provide: APP_FILTER, useClass: DomainErrorFilter },     // 7. doménové chyby → HTTP
  ],
})
export class AppModule implements NestModule {
  configure(c: MiddlewareConsumer) { c.apply(RequestIdMiddleware).forRoutes(CatsController); } // 1.
}

@Controller('cats')
export class CatsController {
  constructor(private readonly cats: CatsService) {}

  @Public()
  @Get() list() { return this.cats.list(); }

  @Roles('admin')
  @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParsePositiveIntPipe) id: number, @CurrentUser() user: User) {
    this.cats.remove(id, user);   // hází NotFoundError → filter → 404
  }
}
```

## Věty na pohovor

- *„Auth je guard, ne middleware — guard ví, který handler poběží, a čte jeho
  metadata (`@Public`, `@Roles`)."*
- *„401 = nevím, kdo jsi; 403 = vím, ale nesmíš. Guard, který vrátí `false`,
  dá 403, proto autentizace hází `UnauthorizedException`."*
- *„Interceptor je jediné místo, které vidí výsledek handleru i čas jeho běhu
  — logování s latencí, envelope, cache, timeout."*
- *„Globální věci registruju jako `APP_*` providery, aby šly přes DI a platily i v testech."*
- *„Timeout interceptor handler nezastaví, jen pošle 408. Opravdové zrušení
  potřebuje AbortSignal až do I/O."*

---

## Kontrolní otázky

1. Nakresli pořadí: middleware, guard, interceptor, pipe, handler, filter.
   Proč `ValidationPipe` nevidí request, který guard odmítl? A uvidí
   `TimingInterceptor` výjimku z guardu?
2. Proč je `app.useGlobalGuards(new AuthGuard(...))` horší než `APP_GUARD`
   provider? Co se stane v e2e testu, který staví `Test.createTestingModule({ imports: [AppModule] })`?
3. Endpoint `GET /me` bez tokenu má vrátit 401, s tokenem uživatele bez role
   `admin` na `DELETE /cats/1` 403. Kde v kódu vznikne který kód a proč by
   `return false` v auth guardu bylo špatně?

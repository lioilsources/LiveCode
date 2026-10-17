# TS + Nest cheatsheet — tvary naslepo

> Večer před pohovorem: přečti, zavři, napiš sekce 5–8 z hlavy. Nic nového.

## 1. Typy — 10 tvarů

```ts
// objektový tvar: interface (rozšiřitelný) nebo type alias (umí unie)
interface User { id: string; name: string; email?: string; readonly createdAt: Date }
type Role = 'admin' | 'member';                       // union literálů místo enum

// discriminated union = Go sealed interface + type switch
type Event =
  | { kind: 'created'; id: string }
  | { kind: 'paid'; id: string; amount: number }
  | { kind: 'refunded'; id: string; reason: string };

function describe(e: Event): string {
  switch (e.kind) {
    case 'created':  return `created ${e.id}`;
    case 'paid':     return `paid ${e.amount}`;       // e je tady zúžené na 'paid'
    case 'refunded': return `refunded: ${e.reason}`;
    default: {
      const never: never = e;                         // kompilátor hlídá úplnost
      throw new Error(`unhandled ${JSON.stringify(never)}`);
    }
  }
}

// narrowing
function len(x: string | string[] | null): number {
  if (x == null) return 0;              // null i undefined
  if (typeof x === 'string') return x.length;
  return x.length;                      // string[]
}

// unknown místo any — musíš zúžit, než použiješ
function parse(json: string): unknown { return JSON.parse(json); }

// type guard
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'id' in x && 'name' in x;
}

// generika + constraint + keyof
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((i) => i[key]);
}

// utility types (DTO motivace)
type CreateUser = Omit<User, 'id' | 'createdAt'>;
type UpdateUser = Partial<CreateUser>;
type ById = Record<string, User>;

// as const + odvození unie z hodnot
const STATUSES = ['todo', 'doing', 'done'] as const;
type Status = (typeof STATUSES)[number];             // 'todo' | 'doing' | 'done'

// satisfies — ověří tvar, ale nechá přesný typ
const config = { port: 3000, env: 'dev' } satisfies Record<string, string | number>;
```

**`??` vs `||`:** `0 || 5 === 5`, `0 ?? 5 === 0`. Pro defaulty čísel/stringů vždy `??`.

## 2. Třídy — tvar, který Nest používá všude

```ts
class UsersService {
  private readonly users = new Map<string, User>();
  constructor(private readonly clock: Clock) {}      // parameter property = pole + přiřazení
  now(): Date { return this.clock.now(); }
}

abstract class UsersRepository {                     // abstract class = DI token i kontrakt
  abstract findById(id: string): Promise<User | undefined>;
}
```

Typy za běhu **neexistují** → interface nemůže být DI token ani validovat request.
Proto Nest: DTO = **třída** s dekorátory, kontrakt pro DI = **abstract class** nebo `Symbol` + `@Inject`.

## 3. Chyby

```ts
class NotFoundError extends Error {
  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
  }
}

try {
  await doWork();
} catch (e: unknown) {                                // e může být cokoli
  if (e instanceof NotFoundError) return null;
  throw new Error('doWork failed', { cause: e });     // ≈ fmt.Errorf("...: %w", err)
}
```

## 4. Kolekce — pasti

```ts
[10, 1, 2].sort();                    // [1, 10, 2] ❗ lexikograficky + MUTUJE
[10, 1, 2].toSorted((a, b) => a - b); // [1, 2, 10], originál beze změny
for (const x of arr) {}               // hodnoty ✅
for (const k in obj) {}               // klíče objektu (na pole nepoužívat)
const m = new Map<string, number>();  // mapa: Map, ne {} (pořadí vložení, libovolné klíče)
m.set(k, (m.get(k) ?? 0) + 1);        // počítání frekvencí
const byRole = Object.groupBy(users, (u) => u.role);   // Node 21+
const copy = { ...obj };              // ❗ mělká kopie
```

## 5. Async — vzory

```ts
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal?.throwIfAborted();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });

// paralelně (≈ errgroup bez cancel) vs. sekvenčně
const all = await Promise.all(ids.map((id) => fetchUser(id)));          // fail-fast, ostatní běží dál!
const settled = await Promise.allSettled(ids.map(fetchUser));           // nikdy nereject
for (const id of ids) await fetchUser(id);                              // sekvenčně (záměrně?)

// concurrency limit (≈ errgroup.SetLimit) — zachová pořadí
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;                 // bezpečné: jedno vlákno, mezi await nic jiného neběží
      results[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// timeout / cancel (≈ context.WithTimeout)
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
const combined = AbortSignal.any([parentSignal, AbortSignal.timeout(2000)]);

// retry s exponential backoff + full jitter
async function retry<T>(fn: () => Promise<T>, retries = 3, baseMs = 100, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries || signal?.aborted) throw e;
      await sleep(Math.random() * baseMs * 2 ** attempt, signal);
    }
  }
}
```

**Pořadí:** sync kód → `process.nextTick` → microtasky (`.then`, `await`) → macrotasky (`setTimeout`, I/O, `setImmediate`).

## 6. Nest — modul, controller, service, DTO

```ts
// tasks/dto/create-task.dto.ts
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum TaskStatus { Todo = 'todo', Done = 'done' }

export class CreateTaskDto {
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
}
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

// tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface Task { id: string; title: string; status: TaskStatus }

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  create(dto: CreateTaskDto): Task {
    const task: Task = { id: randomUUID(), status: TaskStatus.Todo, ...dto };
    this.tasks.set(task.id, task);
    return task;
  }
  findAll(status?: TaskStatus): Task[] {
    const all = [...this.tasks.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }
  findOne(id: string): Task {
    const t = this.tasks.get(id);
    if (!t) throw new NotFoundException(`Task ${id} not found`);
    return t;
  }
  update(id: string, dto: UpdateTaskDto): Task {
    const updated = { ...this.findOne(id), ...dto };
    this.tasks.set(id, updated);
    return updated;
  }
  remove(id: string): void {
    this.findOne(id);
    this.tasks.delete(id);
  }
}

// tasks/tasks.controller.ts
import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post() create(@Body() dto: CreateTaskDto) { return this.tasks.create(dto); }          // 201 default
  @Get() findAll(@Query('status') status?: TaskStatus) { return this.tasks.findAll(status); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.tasks.findOne(id); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) { return this.tasks.update(id, dto); }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseUUIDPipe) id: string) { this.tasks.remove(id); }
}

// tasks/tasks.module.ts
@Module({ controllers: [TasksController], providers: [TasksService], exports: [TasksService] })
export class TasksModule {}

// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.enableShutdownHooks();
await app.listen(3000);
```

## 7. Nest — pipeline (pořadí!)

```
request → middleware → guards → interceptors (před) → pipes → handler
        → interceptors (po) → response          chyba kdekoli → exception filters
```

```ts
// guard: smí request dál? (auth) — false ⇒ 403, throw UnauthorizedException ⇒ 401
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.headers['x-api-key'] !== 'secret') throw new UnauthorizedException();
    return true;
  }
}

// interceptor: obal kolem handleru (logging, timing, transformace odpovědi)
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    return next.handle().pipe(map((data) => ({ data, meta: { durationMs: Date.now() - start } })));
  }
}

// exception filter: doménová chyba → HTTP
@Catch(NotFoundError)
export class NotFoundFilter implements ExceptionFilter {
  catch(e: NotFoundError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(404).json({ error: 'not_found', message: e.message });
  }
}

// custom param decorator
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().user);

// globální registrace PŘES DI (může injektovat závislosti) — v providers modulu:
{ provide: APP_GUARD, useClass: ApiKeyGuard }
```

| Potřebuju… | Použij |
|---|---|
| logovat / přidat header na všechno, nezávisle na routě | middleware |
| rozhodnout „smí dál?" (auth, role, rate limit) | guard |
| validovat / převést vstup | pipe |
| měřit čas, obalit odpověď, cache, timeout | interceptor |
| přeložit výjimku na HTTP odpověď | exception filter |

## 8. Nest — DI custom providers

```ts
export const CLOCK = Symbol('CLOCK');
export interface Clock { now(): Date }

@Module({
  providers: [
    { provide: CLOCK, useValue: { now: () => new Date() } satisfies Clock },
    { provide: UsersRepository, useClass: InMemoryUsersRepository },   // abstract class jako token
    {
      provide: 'CONFIG',
      useFactory: () => ({ apiKey: process.env.API_KEY ?? 'dev' }),
    },
    { provide: 'DB', useFactory: async (cfg: Config) => connect(cfg.url), inject: ['CONFIG'] },
  ],
})
export class AppModule {}

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,            // token = třída → stačí typ
    @Inject(CLOCK) private readonly clock: Clock,       // token = Symbol → @Inject nutný
  ) {}
}
```

## 9. Testy

```ts
// unit test service s mockem repozitáře
const repo = { findById: jest.fn() };
const mod = await Test.createTestingModule({
  providers: [UsersService, { provide: UsersRepository, useValue: repo }],
}).compile();
const svc = mod.get(UsersService);
repo.findById.mockResolvedValue(undefined);
await expect(svc.get('x')).rejects.toThrow(NotFoundException);

// e2e
let app: INestApplication;
beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));  // stejně jako main.ts!
  await app.init();
});
afterAll(() => app.close());

it('POST /tasks validates', () =>
  request(app.getHttpServer()).post('/tasks').send({ title: '' }).expect(400));

// table-driven (≈ Go []struct{...})
it.each([
  [{ title: '' }, 400],
  [{ title: 'ok' }, 201],
])('POST %j → %i', (body, code) => request(app.getHttpServer()).post('/tasks').send(body).expect(code));
```

## 10. Věty na pohovor

- *„Node má jedno vlákno s event loopem — souběžnost je I/O, ne CPU. CPU práci posílám do worker_threads nebo jiné služby."*
- *„Promise.all je fail-fast, ale ostatní promisy nezruší — zrušení řeším AbortSignalem, který propaguju dolů jako context v Go."*
- *„Typy za běhu neexistují, takže na hranici systému validuju — v Nestu DTO třída + ValidationPipe."*
- *„V Nestu dávám kontrakty jako abstract class, protože interface nemůže být DI token."*
- *„Guard rozhoduje jestli, pipe co přijde, interceptor obaluje, filter překládá chyby."*

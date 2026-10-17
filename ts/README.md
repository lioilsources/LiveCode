# Track D — TypeScript + Node.js + NestJS (týden před live codingem)

> **Instrukce pro Claude Code:** stejný režim jako Go tracky. Vysvětluj česky, kód
> a identifikátory anglicky. Student je zkušený **Go** vývojář (služby, infra),
> zná **Dart/Flutter** (async/await, Future, null safety) a Node.js jen z
> generování klientů. Hluboký TS backend nezná. Slabina: **„číst umím, limituje
> mě psaní"** → u každého tématu drilly z prázdné stránky, ne další výklad.

## Proč tenhle track

Firma má TypeScript/Node.js jako hlavní backendový jazyk. Python berou taky,
ale v live codingu se skoro jistě sáhne po TS — a typicky po **NestJS**.
Cíl za týden: napsat z hlavy malou REST službu v Nestu (controller → service →
DTO s validací → testy) a nenechat se zaskočit async/event loop otázkami.

## Mapa Go → TS (most, po kterém půjdeš celý týden)

| Go | TypeScript / Node | Pozor na |
|---|---|---|
| implicitní interface | **structural typing** — typ pasuje, když má tvar | platí i pro třídy, nejen interfaces |
| `type X struct` | `interface X {}` / `type X = {}` / `class X` | typy **za běhu neexistují** |
| sealed interface + type switch | **discriminated union** + `switch (x.kind)` + `never` | |
| `error` jako hodnota | `throw` cokoli + `catch (e: unknown)` | `e` není Error, dokud to neověříš |
| `nil` | `null` **a** `undefined` | `strictNullChecks`, `?.`, `??` vs `\|\|` |
| generika `[T any]` | `<T>`, `<T extends …>`, `keyof` | utility types `Partial`, `Pick`, `Omit`… |
| goroutina | **neexistuje** — 1 vlákno + event loop | CPU práce blokuje všechny requesty |
| channel / future | `Promise` | Promise startuje hned při vytvoření |
| `errgroup` / `WaitGroup` | `Promise.all` / `Promise.allSettled` | `all` nezruší ostatní při chybě |
| `context.Context` | `AbortController` / `AbortSignal` | zrušení musíš propagovat ručně |
| worker pool `SetLimit` | ruční pool / `p-limit` | `Promise.all` na 10k položek = 10k naráz |
| `http.Handler` middleware | Nest middleware / guard / interceptor | jasné pořadí v request pipeline |
| ruční DI v `main()` / wire | Nest **IoC container** (`@Injectable`, `@Module`) | DI token = třída (proto třídy, ne interfaces) |
| `go test` + `httptest` | **Jest** + `@nestjs/testing` + `supertest` | |

## Plán týdne

Jeden den = jedna lekce ≈ 2–3 h. Každá lekce: `LESSON.md` → `examples/`
(spustitelné) → `drills/` (z prázdné stránky) → `exercise/` (zadání + testy).

| Den | Lekce | Obsah | Stav |
|---|---|---|---|
| D1 | [TS pro Go vývojáře](lessons/D1-ts-basics/LESSON.md) | structural typing, `type` vs `interface`, union + narrowing, discriminated union + `never`, `unknown`/`any`, `null`/`undefined`, třídy + parameter properties, **typy za běhu neexistují** | 🟡 |
| D2 | [Generika, utility types, chyby](lessons/D2-generics-utility-errors/LESSON.md) | generika + constraints + `keyof`, `Partial/Pick/Omit/Record`, type guards `x is T`, `satisfies`, `as const`, chyby (custom `Error`, `unknown` v catch, Result), kolekce: `Map`/`Set`, `sort` past, `for…of` vs `for…in` | 🟡 |
| D3 | [Async & Node runtime](lessons/D3-async-node/LESSON.md) | event loop, microtask vs macrotask, Promise, `all/allSettled/race/any`, **concurrency limit**, `AbortController` jako context, timeout, retry + backoff, `await` ve smyčce, blokování event loopu | 🟡 |
| D4 | [NestJS základy](lessons/D4-nest-basics/LESSON.md) | modul, controller, provider, **DI**, custom providers (`useValue/useFactory/useClass`, tokeny), DTO + `class-validator` + `ValidationPipe`, built-in pipes, `HttpException`, CRUD | 🟡 |
| D5 | [Nest request pipeline](lessons/D5-nest-pipeline/LESSON.md) | middleware → guard → interceptor → pipe → handler → interceptor → filter; auth guard, custom decorator, logging/transform interceptor, exception filter, config, lifecycle hooks | 🟡 |
| D6 | [Testování & data](lessons/D6-testing-data/LESSON.md) | unit testy s `Test.createTestingModule`, mocky (`jest.fn`, `overrideProvider`), e2e přes `supertest`, repository pattern, stránkování a query DTO, TypeORM/Prisma do hovoru | 🟡 |
| D7 | Mock interview | 2 úlohy z [`tasks/`](tasks/README.md) na čas + [`interview/THEORY_QA.md`](interview/THEORY_QA.md) + [`interview/GOTCHAS.md`](interview/GOTCHAS.md) | 🟡 |

Rychlé opáčko kdykoli: [`cheatsheet/TS_NEST_CHEATSHEET.md`](cheatsheet/TS_NEST_CHEATSHEET.md).

## Spouštění

```bash
cd ts
npm install

npx tsx lessons/D1-ts-basics/examples/01-structural-typing.ts   # ukázka D1–D3 (bez Nest DI)
npm run ex:nest lessons/D4-nest-basics/examples/01-module-controller-service.ts  # ukázka D4–D5
npx jest lessons/D6-testing-data/examples                        # ukázky D6 jsou testy
npx jest lessons/D1-ts-basics/drills/01                          # jeden drill
npx jest lessons/D1-ts-basics                                    # celá lekce
npx jest tasks/01-todo-crud/solution                             # vzorové řešení úlohy
npm run typecheck                                                # tsc --noEmit nad vším
```

> **Proč Nest ukázky ne přes `tsx`:** esbuild neemituje decorator metadata →
> Nest DI tiše injektuje `undefined` a první request spadne na 500. `ts-node`
> i `ts-jest` metadata emitují. (Dobrá otázka na pohovor: „proč Nest potřebuje
> `emitDecoratorMetadata`?")
>
> `npm run typecheck` hlásí chyby v `drills/*/drill.test.ts`, dokud jsou drilly
> prázdné — to je záměr. Jinde musí být čisto.

Verze: Node 22, TypeScript 6, **NestJS 11** (CommonJS — to, co reálně běží ve
firmách; Nest 12 je ESM-only), Jest 30 + ts-jest, supertest.

## Konvence (pro generování dalšího obsahu)

- **Drill** = `drills/NN-name/drill.ts` je **prázdný** (jen zadání v komentáři)
  + `drill.test.ts`. Test se dokud není řešení nezkompiluje — chyba typů z
  ts-jest je součást výuky (jako hlášky kompilátoru v Go drillech).
- **Exercise** = `exercise/README.md` + kostra, která se **zkompiluje** a hází
  `throw new Error('TODO')` + testy.
- **Task** (live coding na čas) = `tasks/NN-name/README.md` (zadání, časový
  limit, co interviewer sleduje) + kostra + testy + `solution/` (kopie testů,
  zelené). Na `solution/` se dívej až po pokusu.
- Každý drill/exercise ověřen referenčním řešením, pak vrácen do prázdna.
- Každá lekce končí 3 kontrolními otázkami → `PROGRESS.md` (v kořeni repa).

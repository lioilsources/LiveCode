# THEORY Q&A — TypeScript / Node.js / NestJS backend

> Otázky, které padají na ústní části a „mezi řečí" při live codingu.
> Odpovědi jsou psané tak, **jak je říct nahlas**: nejdřív jedna věta
> (jádro), pak 2–4 body detailu, pak případně příklad. Česky s anglickými
> termíny — tak, jak se o tom mluví v týmu.
>
> Trénink: přečti otázku, **odpověz nahlas** (klidně do telefonu), pak porovnej.
> Kdo zná Go, má výhodu — u každé otázky je, jak ji využít.

---

## Q1. Jak funguje event loop v Node.js?

**Jádro:** *„Node spouští JavaScript v jednom vlákně; I/O je neblokující —
operace se předá OS nebo libuv thread poolu a callback se zařadí do fronty,
kterou event loop postupně zpracovává."*

- JS kód běží na **jednom vlákně**. Nikdy neběží dva kusy JS současně → žádné
  data races na proměnných, žádné mutexy pro běžný stav.
- I/O (síť, soubory, DB) **neblokuje** — síť přes epoll/kqueue, souborové
  operace, DNS a crypto přes **libuv thread pool** (default 4 vlákna).
- Event loop má **fáze**: timers → pending callbacks → poll (I/O) → check
  (`setImmediate`) → close callbacks. Mezi každým callbackem se vyprázdní
  `nextTick` fronta a **microtask fronta** (Promises).
- Důsledek: **CPU-heavy kód blokuje všechny requesty** — 200 ms JSON parse
  nebo bcrypt v hlavním vlákně = 200 ms latence pro všechny ostatní.

**Go most:** *„V Go mám M:N scheduler a goroutiny, které běží paralelně na
všech jádrech. Node má jedno vlákno a concurrency jen pro I/O. Proto v Node
nepotřebuju mutex na sdílenou mapu, ale musím hlídat, abych neblokoval loop."*

---

## Q2. Rozdíl mezi microtask a macrotask?

**Jádro:** *„Microtasky (Promise callbacky, pokračování po `await`) se vyprázdní
celé po každém kusu synchronního kódu — dřív, než event loop vezme další
macrotask (timer, I/O callback, `setImmediate`)."*

- Pořadí: **sync → `process.nextTick` → microtasky → další macrotask**.
- `await x` = zbytek funkce se naplánuje jako microtask.
- Past: rekurzivní microtasky (Promise, který plánuje další Promise) dokážou
  **vyhladovět** I/O — loop se k timerům nikdy nedostane.
- `setTimeout(fn, 0)` neznamená „hned", ale „v nejbližší timers fázi, nejdřív
  za 1 ms".

Viz `GOTCHAS.md` #1 — na tohle se ptají jako „co to vypíše?".

---

## Q3. Jak škáluješ Node aplikaci? ⚠️

**Past:** okamžitě odpovědět „Kubernetes, horizontal pod autoscaler". To je
infra — interviewer se ptá, jestli rozumíš **runtime**. Začni uvnitř procesu.

**Jádro:** *„Nejdřív v procesu: Node zvládne tisíce souběžných I/O operací
v jednom vlákně, pokud ho neblokuju. CPU-bound práci dám do `worker_threads`
nebo do fronty. Jedno vlákno = jedno jádro, takže pro víc jader spustím víc
procesů — cluster modul, PM2, nebo víc replik v Kubernetes za load balancerem."*

Ve vrstvách:

1. **Neblokovat event loop** — žádné sync API (`readFileSync`, `bcrypt.hashSync`)
   v request cestě, velká JSON data streamovat, měřit **event loop lag**
   (`perf_hooks.monitorEventLoopDelay`).
2. **Řízená concurrency** — omezit souběžné odchozí volání (pool, `p-limit`),
   connection pool k DB správně velký, timeouty všude.
3. **CPU práce mimo hlavní vlákno** — `worker_threads` (pool, např. `piscina`)
   pro hashování, kompresi, generování PDF; nebo asynchronně přes frontu
   (BullMQ/Redis, SQS) na samostatné workery.
4. **Víc jader** — `cluster` / PM2 (víc procesů sdílí port) nebo, v kontejnerovém
   světě častěji, **1 proces na pod a víc replik**.
5. **Stateless** — session/cache v Redisu, ne v paměti procesu, jinak repliky
   nefungují.

**Go most:** *„V Go by stačil jeden proces a `GOMAXPROCS`; v Node je multi-core
otázka procesů, ne vláken. Ale princip bounded parallelism je stejný jako
worker pool v Go."*

---

## Q4. `Promise.all` vs `allSettled` vs `race` vs `any`?

| | Resolve | Reject | Kdy |
|---|---|---|---|
| `all` | všechny OK → pole výsledků | **první** chyba | potřebuju všechno, jinak nic |
| `allSettled` | vždy → `{status, value \| reason}[]` | nikdy | best-effort, chci vědět, co selhalo |
| `race` | první **dokončený** (OK i chyba) | první dokončený, pokud je to chyba | timeout (`race([work, timeout])`) |
| `any` | první **úspěšný** | všechny selhaly → `AggregateError` | redundantní zdroje, první vyhrává |

**Klíčová věta:** *„Žádná z nich nic neruší. Když `all` rejectne, ostatní
Promises běží dál — pro zrušení musím předat `AbortSignal` a zavolat `abort()`."*

**Go most:** `all` ≈ `errgroup` **bez** `WithContext`; `allSettled` ≈
`WaitGroup` + slice chyb; `race` s timeoutem ≈ `select` s `time.After`.

---

## Q5. Jak řešíš cancellation a timeouty?

**Jádro:** *„`AbortController` / `AbortSignal` je obdoba Go contextu: signal
předávám dolů voláním, `fetch` a většina moderních API ho přijímá, a na
timeout mám `AbortSignal.timeout(ms)`."*

```ts
async function getUser(id: string, signal?: AbortSignal) {
  const res = await fetch(`${BASE}/users/${id}`, { signal });
  return res.json();
}

const signal = AbortSignal.any([req.signal, AbortSignal.timeout(2_000)]); // zrušení klientem NEBO timeout
await getUser('7', signal);
```

- Zrušení je **kooperativní** — vlastní dlouhé smyčky musí kontrolovat
  `signal.aborted` / `signal.throwIfAborted()` (jako `ctx.Err()`).
- `AbortSignal.any([...])` = kombinace signálů (rodič + timeout), obdoba
  odvozeného contextu.
- Bez signálu Promise **nezrušíš** — jen přestaneš čekat (`Promise.race`),
  práce běží dál.
- V Nestu: timeout interceptor (`rxjs timeout()`) na odpověď, ale odchozí
  volání stejně potřebují vlastní signal / timeout v HTTP klientovi a DB driveru.

---

## Q6. `interface` vs `type`?

**Jádro:** *„Pro tvar objektu je to skoro jedno — `interface` jde rozšiřovat
(`extends`, declaration merging) a dává lepší chybové hlášky; `type` umí
navíc unie, tuple, mapped a conditional types. Já používám `interface` pro
objekty a kontrakty a `type` pro unie a odvozené typy."*

- Jen `type`: `type Status = 'active' | 'banned'`, `type Pair = [string, number]`,
  `type ReadonlyUser = Readonly<User>`.
- Jen `interface`: **declaration merging** (dvě deklarace stejného jména se
  sloučí — používá se pro rozšíření knihoven, např. `Express.Request`).
- Obojí je **structural** — `User` pasuje, kde je očekáván typ se stejným tvarem.
- V Nestu: DTO je **třída** (ne interface ani type), protože dekorátory
  `class-validator` a DI potřebují něco, co existuje za běhu.

**Go most:** *„Structural typing je jako implicitní interfaces v Go — jen platí
pro všechny typy, ne jen pro interfaces."*

---

## Q7. `any` vs `unknown` (vs `never`)?

**Jádro:** *„`any` vypíná typovou kontrolu — jde s ním dělat cokoli. `unknown`
je typově bezpečný protějšek: můžu do něj přiřadit cokoli, ale nic s ním
neudělám, dokud ho nezúžím (narrowing). Na hranice systému patří `unknown`."*

```ts
function handle(e: unknown) {
  if (e instanceof Error) return e.message;   // narrowing
  return String(e);
}
```

- `catch (e)` je v strict módu `unknown` — v JS jde hodit cokoli, i string.
- `JSON.parse` vrací `any` → hned to přiřaď do `unknown` a zvaliduj.
- `never` = typ, který nemá hodnotu → **exhaustiveness check** ve `switch`
  nad discriminated union (`const _: never = x`).
- `any` se šíří (výsledek operace s `any` je `any`) — jeden `any` v knihovně
  tiše vypne kontrolu v půlce kódu.

**Go most:** `unknown` ≈ `any`/`interface{}` v Go (musíš type assertion);
TS `any` v Go nemá obdobu.

---

## Q8. Typy za běhu neexistují — co to znamená pro backend?

**Jádro:** *„TypeScript typy se při kompilaci smažou (type erasure). Kompilátor
mi ověří vnitřní kód, ale data zvenku — HTTP body, env proměnné, zprávy
z fronty, odpověď cizího API — za běhu nic nekontroluje. Na každé hranici
proto dělám runtime validaci."*

- `body as CreateUserDto` **nic neověří** (GOTCHAS #14).
- Nest: DTO třída + `class-validator` dekorátory + globální `ValidationPipe`
  (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Mimo Nest / pro konfiguraci: **zod** (`const Env = z.object({...}); Env.parse(process.env)`)
  — schéma je zároveň typ (`z.infer<typeof Env>`).
- Druhý důsledek: interface **nemůže být DI token** → abstraktní třída nebo
  `Symbol` + `@Inject()`.
- Třetí: dekorátory + `emitDecoratorMetadata` — Nest čte typy parametrů
  konstruktoru z metadat, která **generuje kompilátor** (tsc/SWC). Esbuild/tsx
  je negeneruje a DI pak tiše vloží `undefined`.

---

## Q9. Jak funguje DI v Nestu a co jsou scopes?

**Jádro:** *„Nest má IoC kontejner: třídy označím `@Injectable()`, zaregistruju
je jako providery v `@Module` a Nest je vytvoří a vstříkne přes konstruktor
podle typu (tokenu). Defaultně je každý provider singleton v rámci aplikace."*

- **Provider** = cokoli pod tokenem: `useClass`, `useValue` (konstanta, mock),
  `useFactory` (async init, např. DB klient s configem, `inject: [ConfigService]`),
  `useExisting` (alias).
- **Moduly** zapouzdřují: provider je vidět jen v modulu, dokud ho
  neexportuje (`exports`) a jiný modul neimportuje (`imports`).
- **Scopes:**
  - `DEFAULT` — singleton (99 % případů, nejrychlejší),
  - `REQUEST` — nová instance na request (např. per-tenant kontext);
    **probublá nahoru** — všechno, co ho injektuje, se stane request-scoped → výkon,
  - `TRANSIENT` — nová instance pro každého konzumenta.
- Request-scoped data radši přes **`AsyncLocalStorage`** (např. `nestjs-cls`)
  — správa kontextu bez request scope.
- Cyklická závislost → `forwardRef()`, ale spíš je to signál špatného designu.

**Go most:** *„V Go DI dělám ručně v `main()` nebo přes wire — Nest dělá totéž
za běhu podle metadat. Singleton provider ≈ jedna instance vytvořená v `main`."*

---

## Q10. Popiš request lifecycle v Nestu.

**Jádro (pořadí zpaměti):**

```
request
  → middleware            (Express úroveň: logování, CORS, body parser)
  → guards                (smí to? → true / false / throw → 403)
  → interceptors (before) (měření času, cache, transformace vstupu)
  → pipes                 (validace a transformace parametrů: ValidationPipe, ParseIntPipe)
  → handler (controller → service)
  → interceptors (after)  (transformace odpovědi, mapování přes RxJS)
  → exception filters     (chytí výjimku kdekoli v řetězci → HTTP odpověď)
response
```

- Každá vrstva má úrovně **global → controller → route** (`app.useGlobalX`,
  `@UseGuards` na třídě, na metodě).
- `HttpException` (`NotFoundException`, …) převede built-in filter na status
  kód; neznámá chyba → **500** bez detailu.

---

## Q11. Guard vs middleware vs interceptor — kdy co?

| | Ví o handleru? | Typické použití | Výstup |
|---|---|---|---|
| **Middleware** | ❌ (jen `req`, `res`, `next`) | logování, request ID, CORS, raw body | `next()` |
| **Guard** | ✅ `ExecutionContext` (+ metadata přes `Reflector`) | **autentizace / autorizace**, role, feature flag | `boolean` → 403 |
| **Interceptor** | ✅ + obaluje volání (`next.handle()` je Observable) | timing, cache, timeout, transformace odpovědi, mapování chyb | upravená odpověď |
| **Pipe** | ✅ jen argument | validace, parsování, defaulty | transformovaná hodnota / 400 |
| **Exception filter** | ✅ | jednotný formát chyb, mapování doménových chyb na HTTP | HTTP odpověď |

**Věta:** *„Auth je guard, protože potřebuje vědět, jaký handler se volá a jaké
má metadata (`@Roles('admin')`) — middleware to neví. Měření času je
interceptor, protože obaluje handler z obou stran."*

**Go most:** middleware ≈ `func(http.Handler) http.Handler`; Nest jen
rozděluje „middleware" na specializované vrstvy s jasným pořadím.

---

## Q12. Jak testuješ Nest aplikaci?

**Jádro:** *„Tři úrovně. Unit testy service s mockem repozitáře přes
`Test.createTestingModule` a `useValue`. E2E testy přes supertest nad celou
aplikací — validace, status kódy, guardy. A integrační testy proti skutečné
DB, typicky Testcontainers v CI."*

- Unit: `jest.Mocked<UsersRepository>`, testuju **chybové větve** (404/409)
  a že se vedlejší efekt nestal (`not.toHaveBeenCalled()`).
- E2E: `createNestApplication()` + **stejné globální pipes jako `main.ts`**
  (`setupApp()`), `overrideProvider` / `overrideGuard`, `afterAll(app.close)`.
- Table-driven přes `test.each` — návyk z Go.
- Async testy vždy s `await` — jinak test projde vždy.

Detail: `lessons/D6-testing-data/LESSON.md`.

---

## Q13. ORM: transakce a N+1?

**Jádro:** *„Transakci dělám přes callback API ORM — `dataSource.transaction`
v TypeORM nebo `prisma.$transaction` — a uvnitř používám jen předaný
transakční manager, jinak dotaz poběží mimo transakci. N+1 vzniká, když
načtu seznam a pak v cyklu dotahuju relace; řeším to joinem / `include`,
batch dotazem `WHERE id IN (...)` nebo DataLoaderem."*

- **TypeORM**: entity jako třídy s dekorátory, Data Mapper / Active Record,
  `relations`, QueryBuilder; nikdy `synchronize: true` v produkci → migrace.
- **Prisma**: `schema.prisma` → generovaný, plně typovaný klient; `include`,
  `select`; migrace `prisma migrate`.
- Isolation level, krátké transakce, žádné HTTP volání uvnitř transakce
  (drží zámky a connection z poolu).
- Souběžné úpravy: **optimistic locking** (`version` sloupec, `WHERE version = :v`
  → 0 řádků → 409) nebo `SELECT … FOR UPDATE`.
- Unikátnost hlídá **unique index**, ne `findByEmail` + `create` (race condition).

**Go most:** *„Stejné jako `db.BeginTx` a předávání `tx` místo `db` — klasická
chyba v Go i v TS je použít globální connection uvnitř transakce."*

---

## Q14. Jaká je tvoje strategie error handlingu?

**Jádro:** *„Rozlišuju očekávané doménové chyby a neočekávané chyby.
Doménové (nenalezeno, konflikt, nevalidní stav) jsou vlastní třídy nebo
Nest `HttpException` a mapují se na 4xx. Neočekávané nechám probublat do
globálního exception filtru, zaloguju je se stack trace a request ID
a klientovi vrátím 500 bez detailů."*

- Vlastní chyby `class DomainError extends Error` + **exception filter**,
  který je mapuje na HTTP → service nezávisí na HTTP vrstvě (alternativa:
  házet `NotFoundException` přímo ze service — pragmatické, v menších
  projektech běžné).
- `catch (e: unknown)` → narrowing (`instanceof`) před použitím.
- **Nikdy nespolknout** chybu (`catch {}`), nikdy floating promise
  (`no-floating-promises`).
- `process.on('unhandledRejection')` jen loguje a ukončí proces — orchestrátor
  ho restartuje. Nepokračovat v nedefinovaném stavu.
- Jednotný formát chybové odpovědi (`{ statusCode, error, message, requestId }`).
- Retry jen na **přechodné** chyby (timeout, 503), ne na 4xx.

**Go most:** *„V Go je chyba hodnota a kompilátor mě nutí ji řešit. V TS mi to
nikdo nevynutí, proto mám pravidla: typované doménové chyby, globální filtr
a lint na floating promises. Pro očekávané chyby občas používám i
Result typ `{ ok: true, value } | { ok: false, error }` — je to Go styl."*

---

## Q15. Idempotence a retry v distribuovaném systému?

**Jádro:** *„Sítě selhávají, takže klient i broker opakují — operace musí být
idempotentní. Pro POST používám Idempotency-Key: server si klíč uloží s
unique constraintem spolu s odpovědí a při opakování vrátí uloženou
odpověď. Retry dělám s exponential backoff a jitterem, jen na přechodné
chyby a s celkovým timeoutem."*

- **At-least-once** doručení (fronty, webhooky) + **deduplikace** na straně
  konzumenta (tabulka zpracovaných message ID) = efektivně exactly-once.
- **Outbox pattern**: zápis do DB a „zpráva k odeslání" v **jedné
  transakci**; samostatný proces outbox čte a publikuje → žádná ztráta ani
  „fantomová" zpráva při pádu mezi DB a brokerem.
- **Circuit breaker** (např. `opossum`): po sérii chyb přestat volat
  downstream, dát mu vydechnout, fail fast.
- **Saga** pro distribuované transakce: sekvence lokálních transakcí +
  kompenzační kroky.
- Backoff + jitter v Node: `await sleep(base * 2 ** attempt * Math.random())`,
  respektovat `AbortSignal`.

**Go most:** *„Tohle je jazykově nezávislé — totéž jsem řešil v Go; v Nestu
bych Idempotency-Key udělal jako interceptor, který před handlerem zkontroluje
úložiště a po handleru odpověď uloží."*

---

## Q16. Proč Nest a ne čistý Express (nebo Fastify)?

**Jádro:** *„Express je minimální HTTP vrstva — routing a middleware,
architekturu si postavíš sám. Nest nad ním (nebo nad Fastify) dává strukturu:
moduly, DI, jasný request pipeline, validaci přes DTO a testovací utility.
Pro tým a větší kódovou základnu je to konzistence; za cenu magie dekorátorů
a pomalejšího startu."*

- Pro Nest: konzistentní struktura napříč týmy, DI → testovatelnost,
  ekosystém (`@nestjs/config`, `typeorm`, `swagger`, `microservices`, `cqrs`).
- Proti: dekorátory a reflexe (méně explicitní), boilerplate, learning curve,
  request scope je pomalý.
- **Fastify adapter** (`@nestjs/platform-fastify`) — rychlejší než Express
  při stejném Nest kódu.
- Alternativy: Fastify samotný, Hono, tRPC (end-to-end typy).

**Go most:** *„Go komunita preferuje stdlib + malé knihovny a explicitní DI;
Nest je opak — framework s konvencemi, blíž Spring Bootu. Chápu obě
filozofie a v Nestu se držím toho, aby business logika v service byla
čisté TS bez závislosti na frameworku."*

---

## Věty na pohovor

Jednovětá shrnutí, která signalizují senioritu. Řekni je **mezi řečí** při
live codingu, ne jako přednášku.

- *„Node je single-threaded pro JS, ale ne pro I/O — největší riziko je zablokovat event loop CPU prací."*
- *„Promise.all nic neruší; pro zrušení předávám AbortSignal, je to můj context.Context."*
- *„Typy za běhu neexistují, takže na hranici systému validuju — DTO s class-validator nebo zod."*
- *„`as` je slib kompilátoru, ne kontrola."*
- *„Kontrakt repozitáře je abstraktní třída, protože interface nemůže být DI token."*
- *„Auth patří do guardu, protože potřebuje znát handler a jeho metadata; middleware je o úroveň níž."*
- *„Await ve smyčce je sekvenční, Promise.all bez limitu je DDoS na vlastní downstream — chci bounded concurrency."*
- *„Unikátnost hlídá DB unique index, kontrola v kódu je jen hezčí hláška."*
- *„E2E test sdílí s main.ts stejný setup, jinak testuju jinou aplikaci, než nasazuju."*
- *„Každý Promise buď await, nebo explicitní catch — floating promise shodí proces."*
- *„Defaulty přes `??`, ne `||` — nula je validní hodnota."*

---

## Go zkušenost jako výhoda — jak to prodat

Nemáš za sebou roky TS backendu. **Nezakrývej to — přerámuj to.** Interviewer
hledá člověka, který rozumí backendu; jazyk je nástroj.

**Úvodní věta, když se zeptají na zkušenost s TS:**

> *„Backend dělám hlavně v Go — služby, infrastruktura, concurrency. TypeScript
> znám z generování klientů a s async modelem mám zkušenost z Dartu. Na Nestu
> se mi líbí, že explicitně dělá to, co v Go dělám ručně: DI, middleware
> řetězec, validaci na hranici. Takže mapuju koncepty, které už znám, na jinou
> syntaxi."*

**Kde Go zkušenost reálně pomáhá — a řekni to:**

| Téma | Co říct |
|---|---|
| Concurrency | „Bounded parallelism znám z worker poolů v Go — v Node je to pool Promises s limitem." |
| Cancellation | „AbortSignal používám jako context — propaguju ho dolů a respektuju ve smyčkách." |
| Chyby | „Z Go mám návyk řešit každou chybu explicitně, proto v TS hlídám floating promises a typuju chyby." |
| Rozhraní | „Structural typing je mi přirozený — implicitní interfaces v Go fungují stejně." |
| Testy | „Table-driven testy přenáším do `test.each`." |
| Distribuované systémy | „Retry, idempotence, outbox jsou jazykově nezávislé — to jsem stavěl." |
| Výkon | „Vím, kde je Node slabší (CPU) a kdy bych sáhl po Go službě nebo worker threads." |

**Co nedělat:**

- ❌ Neomlouvat se („v TS nejsem moc dobrý"). → ✅ „Tohle API si ověřím v dokumentaci — v Go bych to udělal takhle, v Nestu je ekvivalent…"
- ❌ Nekritizovat TS/Node („v Go by to bylo lepší"). → ✅ Srovnávat věcně, s trade-offy.
- ❌ Nepsat Go v TS (`if (err != null)` všude, žádné výjimky). → ✅ Použít idiomy jazyka (výjimky + filtr), Go styl jen tam, kde má smysl (Result typ).
- ❌ Neutíkat k infrastruktuře, když se ptají na runtime (Q3).

**Když nevíš syntaxi:** řekni nahlas, co chceš udělat, a napiš to nejlíp, jak
umíš. *„Chci tady validovat, že limit je do 100 — v class-validatoru je na to
`@Max`, pokud si dobře pamatuju."* Interviewera zajímá, jestli víš **co**
a **proč**; syntaxi ti klidně napoví.

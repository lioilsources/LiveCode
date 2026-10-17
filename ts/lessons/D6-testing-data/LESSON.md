# D6 — Testování & data

> V Go máš `go test`, `testing.T`, table-driven testy a `httptest`. V Nestu je
> to **Jest** + `@nestjs/testing` + `supertest` — principy stejné, syntaxe jiná.
> Na live codingu interviewer skoro vždy řekne *„a jak bys to otestoval?"* —
> a nejlíp to zodpovíš tak, že **test napíšeš**. Druhá půlka lekce je o datové
> vrstvě: repository pattern, stránkování a co říct o ORM, když se zeptají.

## Jak spouštět ukázky

Ukázky v `examples/` jsou **testy**, ne skripty pro `tsx`:

```bash
npx jest lessons/D6-testing-data/examples        # všechny
npx jest lessons/D6-testing-data/examples/02     # jedna
```

**Proč ne `npx tsx`?** `tsx` (esbuild) neemituje `emitDecoratorMetadata`. Nest DI
přes typ v konstruktoru (`constructor(private repo: UsersRepository)`) pak
**tiše injektuje `undefined`** — žádná chyba, jen `Cannot read properties of
undefined` o tři řádky dál. ts-jest metadata emituje, takže Nest kód pouštěj
v Jestu (nebo přes `nest start`, který kompiluje `tsc`). Tohle je mimochodem
dobrá pohovorová historka: *„decorator metadata dělá kompilátor, ne runtime"*.

## 0. Mapa: go test → Jest

| Go | Jest | Poznámka |
|---|---|---|
| `func TestX(t *testing.T)` | `it('...', () => {})` / `test(...)` | `it` a `test` jsou totéž |
| `t.Run("sub", ...)` | `describe('...', () => {})` | vnořování skupin |
| `if got != want { t.Errorf }` | `expect(got).toBe(want)` | assertion knihovna je vestavěná |
| `reflect.DeepEqual` / `cmp.Diff` | `toEqual` | |
| table-driven `[]struct{...}` | `test.each([...])` | |
| `TestMain`, setup | `beforeAll` / `beforeEach` / `afterEach` / `afterAll` | |
| ruční fake struct splňující interface | `jest.fn()`, `jest.Mocked<T>` | |
| `httptest.NewServer` | `supertest(app.getHttpServer())` | |
| `go test -run X` | `npx jest -t 'X'` / `npx jest path` | |
| `t.Parallel()` | soubory běží paralelně v workerech, testy v souboru sériově | |

## 1. Jest základy

```ts
describe('parseAge', () => {
  beforeEach(() => { /* čerstvý stav pro každý test */ });

  it('parsuje číslo', () => {
    expect(parseAge('42')).toBe(42);
  });
});
```

### `toBe` vs `toEqual` ⚠️

| Matcher | Co porovnává | Go analogie |
|---|---|---|
| `toBe` | `Object.is` — primitiva, **stejná reference** | `==` na pointerech |
| `toEqual` | hluboká struktura, **ignoruje `undefined` vlastnosti** | `reflect.DeepEqual` (zhruba) |
| `toStrictEqual` | hluboká struktura + `undefined` + třída instance | přísnější `DeepEqual` |
| `toMatchObject` | **podmnožina** — stačí pole, která uvedeš | |

```ts
expect({ x: 1 }).toBe({ x: 1 });          // ❌ FAIL — dva různé objekty
expect({ x: 1 }).toEqual({ x: 1 });       // ✅
expect(res.body).toMatchObject({ page: 1 });         // ✅ ostatní pole ignoruje
expect(user).toEqual({ id: expect.any(Number), name: 'Olda' }); // ✅ "nějaké číslo"
```

Pravidlo: **primitiva `toBe`, objekty `toEqual`, HTTP odpovědi `toMatchObject`.**

### `toThrow` — předávej funkci

```ts
expect(() => parseAge('-1')).toThrow(RangeError);   // ✅
expect(parseAge('-1')).toThrow();                   // ❌ výjimka vyletí dřív, než ji expect chytí
```

### Async testy — **await nebo return, jinak test lže** 🧨

```ts
it('rejects', async () => {
  await expect(service.getById(42)).rejects.toThrow(NotFoundException);
});
```

Bez `await` se assertion vyhodnotí **až po skončení testu** → test je zelený,
i když by měl spadnout. Je to Jest obdoba Go chyby „spustil jsem goroutinu
v testu a nepočkal na ni". Pravidlo: **každé `expect(...).resolves/.rejects`
má před sebou `await`**.

### `test.each` = table-driven test

```ts
test.each([
  { input: '0', want: 0 },
  { input: '42', want: 42 },
  { input: '007', want: 7 },
])('parseAge($input) = $want', ({ input, want }) => {
  expect(parseAge(input)).toBe(want);
});

test.each(['-1', '1.5', 'abc'])('parseAge(%s) hází', (input) => {
  expect(() => parseAge(input)).toThrow(RangeError);
});
```

Pole objektů + `$jmeno` v názvu, nebo pole tuplů + `%s`/`%i`/`%j`. Na pohovoru
tím ukážeš stejný návyk jako table-driven testy v Go — a interviewer to pozná.

> TS past: u tuplu `['?page=0', 'důvod']` musí callback přijmout **oba**
> argumenty (`(qs, _why) => ...`), jinak ts-jest hlásí chybu typů.

## 2. Mocky

V Go si mock napíšeš jako struct, který splňuje interface. V Jestu je mock
**funkce, která si pamatuje volání** a vrací, co jí řekneš.

```ts
const fetchUser = jest.fn<Promise<User>, [number]>();   // <návrat, [argumenty]>

fetchUser.mockResolvedValue(user);          // vždy resolve
fetchUser.mockResolvedValueOnce(user);      // jen příští volání
fetchUser.mockRejectedValue(new Error('down'));
fetchUser.mockImplementation(async (id) => ({ id, name: 'x' }));

expect(fetchUser).toHaveBeenCalledWith(1);
expect(fetchUser).toHaveBeenCalledTimes(2);
expect(fetchUser).not.toHaveBeenCalled();
```

### Typovaný mock celé třídy

```ts
let repo: jest.Mocked<UsersRepository>;

repo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};
repo.findById.mockResolvedValue(undefined);   // TS hlídá, že vracíš User | undefined
```

`jest.Mocked<T>` udělá ze všech metod `T` mock funkce se správnými typy.
Zapomeneš-li metodu, TS zařve — mock tak nemůže tiše zastarat.

### `jest.spyOn` — obal existující metody

```ts
const spy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
// ...
spy.mockRestore();      // vrať originál (nebo restoreMocks: true v configu)
```

Použij, když nechceš nahradit celý objekt, jen jednu metodu (čas, logger,
`Math.random`).

### Fake timers

```ts
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('retry po 5 s', async () => {
  const p = withRetry(fn);                     // uvnitř setTimeout(…, 5000)
  await jest.advanceTimersByTimeAsync(5_000);  // posune čas a vyprázdní microtasky
  await expect(p).resolves.toBe('ok');
});
```

`advanceTimersByTime` (sync) stačí na čisté callbacky. Jakmile je mezi timery
`await`, použij **`advanceTimersByTimeAsync`** — jinak se `.then` po timeru
nespustí a test visí. (Souvisí s microtask frontou z D3.)

## 3. Repository pattern — abstraktní třída jako DI token

V Go: service dostane interface, v `main()` mu předáš Postgres implementaci,
v testu fake. V Nestu chceš totéž — ale narazíš na **type erasure**:

```ts
interface UsersRepository { findById(id: number): Promise<User | undefined> }

@Injectable()
class UsersService {
  constructor(private repo: UsersRepository) {}   // 🧨 za běhu interface NEEXISTUJE
}
```

Nest čte typ parametru z decorator metadata — a z interfacu tam je `Object`.
DI neví, co injektovat. Dvě řešení:

### a) Abstraktní třída jako token (doporučeno, čistší)

```ts
export abstract class UsersRepository {
  abstract findById(id: number): Promise<User | undefined>;
  abstract create(data: Omit<User, 'id'>): Promise<User>;
}

@Injectable()
export class InMemoryUsersRepository extends UsersRepository { /* Map<number, User> */ }

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private prisma: PrismaService) { super(); }
  findById(id: number) { return this.prisma.user.findUnique({ where: { id } }).then(u => u ?? undefined); }
  // ...
}

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}   // ✅ abstract class existuje za běhu
}

@Module({
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: InMemoryUsersRepository },  // výměna = jeden řádek
  ],
})
export class UsersModule {}
```

Abstraktní třída je **zároveň typ i runtime hodnota** → funguje jako kontrakt
i jako DI token. Žádný `@Inject()`.

### b) Interface + Symbol token

```ts
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
export interface UsersRepository { /* ... */ }

constructor(@Inject(USERS_REPOSITORY) private readonly repo: UsersRepository) {}

providers: [{ provide: USERS_REPOSITORY, useClass: InMemoryUsersRepository }]
```

Funguje taky, ale token a typ jsou dvě věci, které musíš držet v sync, a na
každém místě injekce píšeš `@Inject(...)`.

> Věta na pohovor: **„Typy v TS za běhu neexistují, takže kontrakt repozitáře
> dělám jako abstraktní třídu — je to typ i DI token zároveň a implementaci
> měním jedním řádkem v modulu."**

### Kdo dělá stránkování?

**Repozitář**, ne service. Service přepočítá `page/limit → offset`, repozitář
vrátí `{ items, total }`. V DB to je `LIMIT … OFFSET …` + `COUNT(*)`. Kdo načte
celou tabulku a udělá `slice`, na pohovoru ztrácí body.

## 4. Unit test service v Nestu

```ts
describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    repo = { findById: jest.fn(), findByEmail: jest.fn(), create: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repo },   // mock pod STEJNÝM tokenem
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('neexistující → NotFoundException', async () => {
    repo.findById.mockResolvedValue(undefined);
    await expect(service.getById(42)).rejects.toThrow(NotFoundException);
  });

  it('obsazený email → 409 a create se nevolá', async () => {
    repo.findByEmail.mockResolvedValue(existing);
    await expect(service.register('a@x.cz')).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
```

**Alternativa bez kontejneru:** `new UsersService(repo)`. Je to legitimní
a rychlejší (jako v Go: zavoláš konstruktor s fakem). `Test.createTestingModule`
se vyplatí, když service má víc závislostí nebo chceš ověřit, že **DI wiring**
sedí. Na pohovoru klidně řekni obojí.

Co testovat v unit testu service:
- doménovou logiku (normalizace emailu, přepočet offsetu),
- **chybové větve** (404, 409) — interviewer je chce vidět víc než happy path,
- že se vedlejší efekt **nestane**, když nemá (`not.toHaveBeenCalled()`).

## 5. e2e test přes supertest

```ts
describe('Users API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(UsersRepository).useClass(InMemoryUsersRepository)  // např. místo Prismy
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .compile();

    app = setupApp(moduleRef.createNestApplication());   // ⚠️ stejné jako main.ts
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /users/abc → 400', () =>
    request(app.getHttpServer()).get('/users/abc').expect(400));

  it('POST /users → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Eva', email: 'eva@x.cz', role: 'member' })
      .expect(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), email: 'eva@x.cz' });
  });
});
```

### Tři pasti e2e testů 🧨

1. **Globální pipes nejsou v modulu.** `app.useGlobalPipes(new ValidationPipe())`
   se volá v `main.ts`, ne v `@Module`. `createNestApplication()` v testu je
   **nemá** → validace v testu neběží, test prochází, produkce vrací 400 (nebo
   naopak). Fix: funkce `setupApp(app)` volaná z `main.ts` i z testu.
   (Alternativa: registrovat pipe jako provider `{ provide: APP_PIPE, useClass: ValidationPipe }`
   — pak je součástí modulu.)
2. **Zapomenutý `app.close()`** → Jest: *„did not exit one second after the test
   run has completed"*. Otevřený HTTP server / DB pool drží event loop naživu
   (stejně jako neukončená goroutina drží Go test).
3. **Sdílený stav mezi testy.** `beforeAll` vytvoří jednu aplikaci pro celý
   soubor → in-memory data přetrvávají mezi `it`. Buď počítej s pořadím
   (seed v `beforeAll`, čtecí testy první), nebo `beforeEach` s čerstvou app.

### `overrideProvider` / `overrideGuard`

| Chci | Použij |
|---|---|
| vyměnit repozitář/klienta za fake | `.overrideProvider(Token).useValue(mock)` / `.useClass(Fake)` |
| vypnout auth v testu business logiky | `.overrideGuard(AuthGuard).useValue({ canActivate: () => true })` |
| vyměnit interceptor / pipe | `.overrideInterceptor(...)`, `.overridePipe(...)` |

Auth samotný otestuj **zvlášť** (jeden e2e soubor, kde guard necháš a ověříš
401/403).

### Unit vs e2e — co říct na pohovoru

> *„Service testuju unit testy s mockem repozitáře — rychlé, pokryju chybové
> větve. Controller netestuju unit testem, protože je tenký; místo toho mám
> e2e přes supertest, které ověří validaci, status kódy a DI wiring. Proti
> skutečné DB pouštím integrační testy s Testcontainers nebo dedikovanou
> testovací DB v CI."*

## 6. Stránkování a filtrování přes query DTO

Všechno z URL je **string**. `?page=2` je `'2'`, ne `2`.

```ts
export class ListUsersQuery {
  @IsOptional()
  @Type(() => Number)       // class-transformer: '2' → 2  ('abc' → NaN → @IsInt selže → 400)
  @IsInt()
  @Min(1)
  page: number = 1;         // default = inicializátor pole

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)                 // nikdy nenech klienta stáhnout milion řádků
  limit: number = 10;

  @IsOptional()
  @IsIn(ROLES)
  role?: Role;
}

@Get()
list(@Query() q: ListUsersQuery): Promise<Page<User>> {
  return this.users.list(q);
}
```

Aby to fungovalo, `ValidationPipe` potřebuje **`transform: true`** — jinak
dostaneš do handleru plain object s původními stringy a bez defaultů.

```ts
new ValidationPipe({
  whitelist: true,              // zahoď pole bez dekorátoru
  forbidNonWhitelisted: true,   // ...nebo radši vrať 400
  transform: true,              // vytvoř instanci DTO (→ @Type, defaulty)
})
```

| Bez čeho | Co se pokazí |
|---|---|
| `@Type(() => Number)` | `@IsInt` dostane `'2'` → 400 i pro validní vstup |
| `transform: true` | handler dostane `'2'` (string) a žádný default `page=1` |
| `@IsOptional()` | chybějící parametr → 400 |
| `@Max(100)` | `?limit=1000000` → DoS na vlastní DB |

> Existuje i `transformOptions: { enableImplicitConversion: true }` (převod podle
> TS typu bez `@Type`). Pohodlné, ale magické — `'false'` se převede na `true`.
> Na pohovoru radši explicitní `@Type`.

### Tvar odpovědi

```ts
interface Page<T> { items: T[]; total: number; page: number; limit: number }
```

Stránka za koncem = `200` s `items: []`, ne `404`. Kolekce existuje, jen je
na té stránce prázdná.

### Offset vs cursor pagination

| | Offset (`page`, `limit`) | Cursor (`after=<id>`, `limit`) |
|---|---|---|
| implementace | `LIMIT/OFFSET` | `WHERE id > :after ORDER BY id LIMIT :n` |
| skok na stránku 7 | ✅ | ❌ |
| výkon na hlubokých stránkách | ❌ DB přeskakuje řádky | ✅ index seek |
| stabilita při insertech | ❌ položky se posunou / zdvojí | ✅ |

Na live coding stačí offset. Řekni, že pro feedy / velké tabulky bys šel
do cursoru — to je signál seniority.

## 7. ORM do hovoru: TypeORM vs Prisma

Na live codingu skoro jistě budeš mít in-memory repozitář. Ale otázka
*„a jak by to vypadalo s databází?"* přijde. Stačí umět mluvit:

| | TypeORM | Prisma |
|---|---|---|
| model | třída s dekorátory (`@Entity`, `@Column`, `@ManyToOne`) | `schema.prisma` → **generovaný typovaný klient** |
| dotazy | `repo.find({ where, relations })`, QueryBuilder | `prisma.user.findMany({ where, include })` |
| typová bezpečnost | střední (relace, `select` nejsou plně typované) | vysoká (výsledek přesně odpovídá `select`/`include`) |
| migrace | `typeorm migration:generate` | `prisma migrate dev` / `deploy` |
| Nest integrace | `@nestjs/typeorm`, `@InjectRepository(User)` | vlastní `PrismaService extends PrismaClient` |
| styl | Active Record / Data Mapper, blízko Java/Hibernate | query builder nad schématem |

> ⚠️ `synchronize: true` v TypeORM (auto-sync schématu) **nikdy v produkci** —
> smaže sloupce. Produkce = migrace.

### Transakce

```ts
// TypeORM — callback dostane EntityManager vázaný na transakci
await this.dataSource.transaction(async (em) => {
  const order = await em.save(Order, { userId, total });
  await em.decrement(Stock, { productId }, 'quantity', 1);
});

// Prisma — interaktivní transakce
await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { userId, total } });
  await tx.stock.update({ where: { productId }, data: { quantity: { decrement: 1 } } });
});
```

Klíčové: uvnitř transakce používej **`em` / `tx`**, ne globální repozitář —
jinak dotaz poběží **mimo** transakci (obdoba Go chyby „použil jsem `db`
místo `tx`").

### N+1 problém

```ts
const users = await usersRepo.find();                // 1 dotaz
for (const u of users) {
  u.orders = await ordersRepo.findBy({ userId: u.id });  // + N dotazů 🧨
}
```

Fix: načti relaci najednou — TypeORM `relations: ['orders']` / `leftJoinAndSelect`,
Prisma `include: { orders: true }`, ručně `WHERE user_id IN (...)` a seskupit
v paměti. V GraphQL světě **DataLoader** (batchuje dotazy v rámci jednoho
ticku event loopu). A `await` ve smyčce je navíc i sekvenční (viz D3).

## 8. Idempotence a optimistic locking (krátce)

**Optimistic locking** — dvě souběžné úpravy stejného záznamu:

```sql
UPDATE products SET price = 120, version = version + 1
WHERE id = 7 AND version = 3;          -- 0 řádků? Někdo byl rychlejší → 409 Conflict
```

TypeORM: `@VersionColumn() version: number`. Prisma: ručně přes
`updateMany({ where: { id, version } })` a kontrolu `count`. HTTP ekvivalent:
`ETag` + `If-Match` → `412 Precondition Failed`.

**Idempotence `POST`** — klient pošle `Idempotency-Key` hlavičku; server si
uloží `key → odpověď` (s **unique constraintem** na klíči) a při opakování
vrátí uloženou odpověď místo druhého vytvoření. Retry z klienta / load
balanceru pak nevytvoří dvě objednávky. Stejný princip jako v Go Q3
(at-least-once + dedup).

**Unikátnost (email) řeš v DB, ne jen v kódu.** Kontrola `findByEmail` →
`create` má race condition mezi dvěma requesty. Unique index + chytit chybu
porušení constraintu (Postgres `23505`, Prisma `P2002`) → `ConflictException`.

## 9. Věty na pohovor

- *„`toEqual` porovnává strukturu, `toBe` identitu — objekty vždycky `toEqual`."*
- *„U async testu je `await` před `expect(...).rejects` povinný, jinak test projde vždycky."*
- *„Kontrakt repozitáře je abstraktní třída, protože interface za běhu neexistuje a nemůže být DI token."*
- *„E2E test musí mít stejné globální pipes jako `main.ts`, proto mám `setupApp()`."*
- *„Stránkování dělá DB přes LIMIT/OFFSET, ne `slice` v paměti; `limit` má horní mez."*
- *„Unikátnost hlídá unique index; kontrola v kódu je jen hezčí chybová hláška."*

## Drilly a cvičení

- `drills/` — 5 drillů z prázdné stránky (paginate, query DTO, abstract repo,
  service s chybami, e2e-ready modul). Viz `drills/README.md`.
- `exercise/` — Users API se stránkováním, repozitářem, unit i e2e testy (35 min).

## Kontrolní otázky

1. Proč se `UsersRepository` dělá jako `abstract class`, a ne jako `interface`?
   Co přesně Nest za běhu vidí, když v konstruktoru použiješ interface?
2. Request `GET /users?page=2&limit=500` — popiš, co se stane krok po kroku
   (string → `@Type` → validace → odpověď). Co se změní, když v `ValidationPipe`
   chybí `transform: true`?
3. V e2e testu projde `POST /users` s nevalidním emailem jako 201, ale v produkci
   vrací 400. Co je nejpravděpodobnější příčina a jak to opravíš natrvalo?

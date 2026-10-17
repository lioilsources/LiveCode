# D4 — NestJS základy: modul, controller, provider, DI, DTO

> V Go si službu poskládáš sám: `main()` vytvoří DB, předá ji repozitáři,
> repozitář službě, službu handleru, handler routeru. **Nest dělá tohle skládání
> za tebe.** Ty jen deklaruješ „tohle existuje" a „tohle potřebuje tamto".
> Na live codingu se po tobě chce právě tenhle tvar: modul → controller →
> service → DTO s validací → správné status kódy. Tahle lekce je ten tvar.

## Jak spouštět examples

```bash
cd ts
npm run ex:nest lessons/D4-nest-basics/examples/01-module-controller-service.ts
```

⚠️ **Proč ne `npx tsx`?** tsx (esbuild) neemituje `design:paramtypes` metadata.
Nest podle nich zjišťuje, *co chce konstruktor dostat*. Bez nich se injektuje
`undefined` a dostaneš 500 při prvním volání služby. `ex:nest` = `ts-node
--transpile-only`, který metadata emituje. Jest (ts-jest) je emituje taky.
Tohle je mimochodem dobrá věta na pohovor — viz §3.

---

## 1. Co je Nest — „Spring/Angular pro Node"

Express je jako Go `net/http`: router + handlery + middleware, zbytek je na tobě.
**Nest je framework nad Expressem** (nebo Fastify), který přidává:

- **moduly** — jak rozdělit aplikaci na části,
- **IoC container** — kdo vytváří objekty a předává jim závislosti,
- **dekorátory** — routing, validace, auth deklarativně nad třídami,
- **pevné pořadí request pipeline** — middleware, guardy, pipes, interceptory, filtry (D5).

Je **opinionated**: existuje „ten správný" způsob, jak věci dělat. To je na
pohovoru výhoda — interviewer čeká konkrétní tvar a ty ho dodáš.

```
┌──────────────────────────────────────────────┐
│ AppModule                                    │
│   imports: [BooksModule, UsersModule]        │
│                                              │
│   ┌──────────────── BooksModule ───────────┐ │
│   │ controllers: [BooksController]  ← HTTP │ │
│   │ providers:   [BooksService]     ← logika│ │
│   │ exports:     [BooksService]     ← pro jiné moduly │
│   └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

| Nest pojem | Co to je | Go analogie |
|---|---|---|
| **Module** | krabice, která říká, co obsahuje a co vystavuje | Go package + kód v `main()`, který ho drátuje |
| **Controller** | třída s HTTP handlery (routing přes dekorátory) | `http.HandlerFunc` + registrace v `mux` |
| **Provider** | cokoli, co container vytvoří a injektuje (service, repo, config) | struct, který předáváš konstruktorům |
| **IoC container** | mapa *token → instance*, staví graf závislostí | tvůj `main()` / `wire` |
| **DTO** | třída popisující tělo requestu + validace | struct s `json:"..."` tagy + ruční `validate()` |

## 2. Minimální appka — tři soubory, jeden tvar

```ts
// books.service.ts
@Injectable()
export class BooksService {
  private readonly books = new Map<number, Book>();
  findAll(): Book[] { return [...this.books.values()]; }
}

// books.controller.ts
@Controller('books')                         // prefix /books
export class BooksController {
  constructor(private readonly books: BooksService) {}  // ← DI

  @Get()                                     // GET /books
  findAll() { return this.books.findAll(); } // návratová hodnota → JSON, 200
}

// books.module.ts
@Module({ controllers: [BooksController], providers: [BooksService] })
export class BooksModule {}

// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(3000);
}
bootstrap();
```

Všimni si:

1. **`private readonly books: BooksService` v konstruktoru** = *parameter property*
   (D1). Deklaruje pole, přiřadí ho, a zároveň je to DI požadavek.
2. **Handler jen vrací hodnotu.** Nest ji serializuje na JSON. Žádné `res.json()`.
   Vrátíš `Promise`? Nest počká. Vrátíš `undefined`? Prázdné tělo.
3. **Default status:** `200`, u `@Post()` **`201`**. Jinak `@HttpCode(204)`.

### Go pro srovnání

```go
func main() {
    svc := books.NewService()            // ručně
    h := books.NewHandler(svc)           // ručně předám
    mux := http.NewServeMux()
    mux.HandleFunc("GET /books", h.FindAll)
    http.ListenAndServe(":3000", mux)
}
```

V Go *ty* píšeš graf. V Nestu ho *deklaruješ* a container ho postaví. Výhoda
roste s počtem modulů; na 3 třídách vypadá Nest jako ceremonie — a je.

## 3. DI a IoC container — jak to doopravdy funguje ⚠️

**Analogie:** container je **šatna v divadle**. Každý provider má **lísteček
(token)**. Když konstruktor řekne „potřebuju `BooksService`", container
najde lísteček `BooksService`, a pokud kabát (instanci) ještě nemá, ušije ho
(zavolá `new` — rekurzivně se závislostmi), pověsí a vydá. Příště vydá **ten
samý** kabát.

### Pravidla

1. **Token = třída.** `providers: [BooksService]` je zkratka pro
   `{ provide: BooksService, useClass: BooksService }`.
2. **Default scope = singleton** pro celou aplikaci. Jedna instance, sdílená
   všemi requesty. (Proto in-memory `Map` v service „přežije" mezi requesty.)
   Existují i `Scope.REQUEST` a `Scope.TRANSIENT` — na pohovoru stačí vědět,
   že request scope je pomalejší a „nakazí" celý řetěz závislostí nad sebou.
3. **Provider je vidět jen v modulu, kde je deklarovaný**, pokud ho modul
   **neexportuje** a druhý modul ho **neimportuje** (§5).
4. **`@Injectable()`** na třídě říká: „tahle třída má závislosti, které má
   container dodat". U třídy bez závislostí to formálně nutné není, ale piš ho
   vždy — je to konvence a signál.

### Jak Nest pozná, co konstruktor chce? 🧨

TypeScript typy **za běhu neexistují** (D1). Jak tedy Nest ví, že první
parametr je `BooksService`?

Díky `emitDecoratorMetadata`. Kompilátor u dekorované třídy vygeneruje:

```js
Reflect.metadata("design:paramtypes", [BooksService])
```

Nest si přes `reflect-metadata` přečte pole tříd a podle nich injektuje.
Důsledky, na které se ptají:

| Situace | Co se stane |
|---|---|
| parametr typu **třída** | ✅ funguje — třída je hodnota za běhu |
| parametr typu **interface** (`repo: BookRepo`) | ❌ interface zmizí, metadata obsahují `Object` → Nest neví, co dát → chyba při startu |
| build bez metadat (esbuild/tsx, Vite) | ❌ injektuje se `undefined` |
| cyklický import dvou souborů | ❌ v metadatech je `undefined` (třída ještě není definovaná) → `forwardRef` |

> Věta na pohovor: **„Nest DI stojí na `emitDecoratorMetadata` — kompilátor
> zapíše typy parametrů konstruktoru jako runtime metadata. Interface za běhu
> neexistuje, proto pro abstrakce používám custom token a `@Inject`."**

### Custom token pro abstrakci (interface)

Chceš, aby service závisela na *abstrakci* úložiště (jako v Go — interface
na straně konzumenta)? Interface nejde použít jako token. Použiješ
**string nebo `Symbol`** + `@Inject`:

```ts
export interface BookRepo {
  findById(id: number): Book | undefined;
  save(b: Book): void;
}
export const BOOK_REPO = Symbol('BOOK_REPO');   // lísteček

@Injectable()
export class BooksService {
  constructor(@Inject(BOOK_REPO) private readonly repo: BookRepo) {}
}

@Module({
  providers: [
    BooksService,
    { provide: BOOK_REPO, useClass: InMemoryBookRepo },  // výměna = 1 řádek
  ],
})
export class BooksModule {}
```

Alternativa, kterou uvidíš v praxi: **abstraktní třída jako token**
(`abstract class BookRepo {...}` + `{ provide: BookRepo, useClass: InMemoryBookRepo }`).
Abstraktní třída za běhu existuje, takže `@Inject` není potřeba. Obojí je OK;
řekni, že víš o obou.

## 4. Custom providers — čtyři tvary

```ts
providers: [
  // 1) useClass — "pod tímhle tokenem vytvoř tuhle třídu"
  { provide: BOOK_REPO, useClass: InMemoryBookRepo },

  // 2) useValue — hotová hodnota (config, konstanta, mock v testu)
  { provide: 'APP_NAME', useValue: 'bookstore' },

  // 3) useFactory — funkce, která hodnotu spočítá; inject = její parametry
  {
    provide: 'DB_URL',
    useFactory: (name: string) => `postgres://localhost/${name}`,
    inject: ['APP_NAME'],
  },
  //    factory může být async → Nest počká před startem (DB connection!)

  // 4) useExisting — alias: druhý lísteček ke stejnému kabátu
  { provide: 'Repo', useExisting: BOOK_REPO },
]
```

| Tvar | Kdy | Go analogie |
|---|---|---|
| `useClass` | implementace abstrakce, přepínání impl. podle prostředí | `var repo Repo = NewInMemoryRepo()` |
| `useValue` | konstanty, config objekty, **mocky v testech** | předání literálu |
| `useFactory` | hodnota závisí na jiných providerech / je async | `db, err := sql.Open(cfg.URL)` v `main()` |
| `useExisting` | alias, jedna instance pod dvěma tokeny | dvě proměnné, jeden pointer |

Injekce custom tokenu **vždy přes `@Inject(TOKEN)`**:

```ts
constructor(@Inject('APP_NAME') private readonly appName: string) {}
```

Bez `@Inject` by metadata řekla `String` — a provider s tokenem `String`
neexistuje.

## 5. Moduly: imports / exports / global

```
UsersModule                       BooksModule
  providers: [UsersService]         imports: [UsersModule]   ← "chci, co vystavuješ"
  exports:   [UsersService] ───────► BooksService(users: UsersService) ✅
```

Pravidla:

1. **Provider je privátní** pro svůj modul.
2. `exports: [X]` → X je k dispozici modulům, které tenhle modul **importují**.
3. Instance je **jedna** — importující modul dostane tu samou (singleton přes celou appku).
4. Chybí export/import → slavná chyba při startu:

```
Nest can't resolve dependencies of the BooksService (?).
Please make sure that the argument UsersService at index [0]
is available in the BooksModule module.
```

Čti ji takhle: *„otazník na pozici 0 = nevím, kde vzít první parametr"*.
Řešení skoro vždy: export ve zdrojovém modulu + import v cílovém.

**`@Global()`** modul se importuje jednou (v `AppModule`) a jeho exporty jsou
všude. Používá se pro config, logger, DB. Nepoužívej ho na doménové moduly —
schováš tím závislosti.

**Circular dependency** (A importuje B, B importuje A): Nest to umí přes
`forwardRef(() => BModule)` a `@Inject(forwardRef(() => BService))`. Na
pohovoru řekni: *„Umí to, ale cyklus je designový smell — vytáhnu sdílenou
část do třetího modulu."*

## 6. Routing dekorátory

```ts
@Controller('books')
export class BooksController {
  @Get()                                    // GET /books?author=x&limit=10
  list(@Query('author') author?: string) {}

  @Get(':id')                               // GET /books/42
  get(@Param('id', ParseIntPipe) id: number) {}   // "42" → 42, "abc" → 400

  @Post()                                   // POST /books → 201
  create(@Body() dto: CreateBookDto) {}

  @Patch(':id')                             // PATCH /books/42
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {}

  @Delete(':id')
  @HttpCode(204)                            // místo default 200
  remove(@Param('id', ParseIntPipe) id: number) {}

  @Get('health/info')
  info(@Headers('x-request-id') rid?: string) {}
}
```

| Dekorátor | Odkud bere | Typ za běhu |
|---|---|---|
| `@Param('id')` | `/books/:id` | **vždy string** (bez pipe) |
| `@Query('limit')` | `?limit=10` | **string** (nebo pole, když se opakuje) |
| `@Body()` | JSON tělo | plain object (bez `transform` **není** instance DTO) |
| `@Headers('x')` | hlavička | string \| undefined (jména lowercase) |
| `@Req()` / `@Res()` | Express objekty | ⚠️ `@Res()` vypne automatickou serializaci — nepoužívej |

🧨 **Past:** `@Param('id') id: number` **nic nekonvertuje**. Typová anotace je jen
pro kompilátor. Za běhu tam je `"42"` a `id === 42` je `false`. Proto
`ParseIntPipe` (nebo globální `transform: true`, viz §7).

**Pořadí rout:** `@Get(':id')` deklarované *před* `@Get('stats')` sežere
`/books/stats` jako id = "stats". Statické cesty piš **před** parametrické.

## 7. DTO + validace — „struct tagy, které se opravdu kontrolují"

V Go: `json:"title"` + ručně `if req.Title == "" { 400 }`. V Nestu je DTO
**třída** (ne interface! — validátor potřebuje něco, co za běhu existuje)
s dekorátory z `class-validator`:

```ts
import { IsInt, IsOptional, IsString, Length, Min, Max, Matches } from 'class-validator';

export class CreateBookDto {
  @IsString() @Length(1, 200)
  title!: string;

  @Matches(/^\d{13}$/, { message: 'isbn must be 13 digits' })
  isbn!: string;

  @IsInt() @Min(1450) @Max(2100)
  year!: number;

  @IsOptional() @IsString()
  author?: string;
}
```

(`!` = *definite assignment* — „neboj, kompilátore, naplní se to zvenku".)

### Jak se to spustí: `ValidationPipe`

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // neznámá pole tiše ZAHODÍ
  forbidNonWhitelisted: true, // ...nebo místo zahození vrať 400
  transform: true,            // plain object → instance DTO + konverze typů
}));
```

Co pipe udělá s `@Body() dto: CreateBookDto`:

```
JSON {"title":"Dune","isbn":"978...","year":1965,"admin":true}
   │
   ▼ class-transformer: plainToInstance(CreateBookDto, body)
   ▼ class-validator:   validate(instance)
   │       ├─ chyby? → BadRequestException 400 { message: ["year must be an integer", ...] }
   │       └─ whitelist: "admin" nemá dekorátor → pryč (nebo 400 s forbidNonWhitelisted)
   ▼
handler dostane čistý objekt
```

| Volba | Bez ní | S ní |
|---|---|---|
| `whitelist` | klient pošle `"role":"admin"` a ty to uložíš (**mass assignment**) | pole bez dekorátoru zmizí |
| `forbidNonWhitelisted` | neznámé pole tiše zmizí | 400 — klient se dozví, že posílá blbost |
| `transform` | `dto instanceof CreateBookDto === false`, `@Param('id') id: number` je string | instance DTO, primitiva podle typu (`"42"` → `42`) |

⚠️ **Pole bez jakéhokoli dekorátoru** je pro `whitelist` neznámé → zahodí se.
Volitelné pole proto vždy `@IsOptional()` + typový validátor.

⚠️ **Query parametry jsou stringy.** `@IsInt() limit` na query selže na `"10"`,
pokud nemáš `transform: true` + `@Type(() => Number)` z `class-transformer`
(nebo `enableImplicitConversion`). Detail v D6 (stránkování).

### Update DTO: `PartialType`

```ts
import { PartialType } from '@nestjs/mapped-types';   // ve Swagger projektech z '@nestjs/swagger'

export class UpdateBookDto extends PartialType(CreateBookDto) {}
// všechna pole volitelná, VALIDACE ZŮSTÁVÁ (když pole přijde, musí být validní)
```

Příbuzní: `PickType(CreateBookDto, ['title'])`, `OmitType(CreateBookDto, ['isbn'])`,
`IntersectionType(A, B)`. Jsou to runtime protějšky TS `Partial/Pick/Omit` (D2) —
TS verze by validační dekorátory nepřenesla, protože typy za běhu neexistují.

### Built-in pipes na parametry

```ts
@Param('id', ParseIntPipe) id: number            // "abc" → 400
@Param('id', ParseUUIDPipe) id: string           // ne-UUID → 400
@Query('active', ParseBoolPipe) active: boolean
@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
@Query('sort', new ParseEnumPipe(SortOrder)) sort: SortOrder
```

## 8. Chyby a status kódy

V Go vracíš `error` a v handleru mapuješ na status. V Nestu **hodíš výjimku**
a vestavěný exception filter z ní udělá odpověď:

```ts
throw new NotFoundException(`book ${id} not found`);
// → 404 {"statusCode":404,"message":"book 42 not found","error":"Not Found"}
```

| Výjimka | Status | Typicky |
|---|---|---|
| `BadRequestException` | 400 | validace (dělá ValidationPipe sám), nesmyslný vstup |
| `UnauthorizedException` | 401 | chybí / neplatná identita (D5) |
| `ForbiddenException` | 403 | identita OK, nemá právo (D5) |
| `NotFoundException` | 404 | zdroj neexistuje |
| `ConflictException` | 409 | duplicitní unikátní klíč, verze nesedí |
| `UnprocessableEntityException` | 422 | syntakticky OK, sémanticky ne |
| `HttpException(body, status)` | cokoli | obecná |
| jakákoli jiná výjimka (`new Error`) | **500** | `{"statusCode":500,"message":"Internal server error"}` — detail se klientovi neukáže |

Kde házet? Debata „service nemá znát HTTP" je legitimní:
- **pragmaticky (na pohovoru OK):** service hází `NotFoundException` přímo.
- **čistě:** service hází doménovou chybu (`BookNotFoundError`), exception filter
  ji mapuje na 404 (D5). Řekni, že víš o obou, a vyber pragmatickou, pokud
  interviewer netlačí.

> Věta na pohovor: **„Neošetřená výjimka je v Nestu 500 bez detailu — to je
> bezpečný default. Pro očekávané stavy hážu `HttpException` potomky, aby
> klient dostal správný kód."**

## 9. Async handlery

```ts
@Get(':id')
async get(@Param('id', ParseIntPipe) id: number): Promise<Book> {
  const book = await this.books.findById(id);   // DB, HTTP volání...
  if (!book) throw new NotFoundException();
  return book;
}
```

- Vrácený `Promise` Nest počká a výsledek serializuje.
- `throw` v async funkci = rejected promise → Nest to chytí stejně jako sync throw.
- 🧨 **Zapomenutý `await`**: `const book = this.repo.find(id)` → `book` je
  Promise, `!book` je `false`, vrátíš `{}`. TS to chytí, jen pokud máš typy
  (proto `Promise<Book>` jako návratový typ — a ESLint `no-floating-promises`).
- Nest neruší handler, když klient odejde (žádný `ctx.Done()` zadarmo jako v Go
  `r.Context()`). Pro dlouhé operace řešíš timeout ručně (D3 AbortController,
  D5 timeout interceptor).

## 10. Kompletní tvar na pohovor (zapamatuj si strukturu)

```
src/
├── main.ts                    NestFactory.create + ValidationPipe + listen
├── app.module.ts              imports: [BooksModule]
└── books/
    ├── books.module.ts        controllers + providers (+ exports)
    ├── books.controller.ts    routing, @Param/@Body, ParseIntPipe, @HttpCode
    ├── books.service.ts       logika, Map, NotFound/Conflict
    ├── dto/
    │   ├── create-book.dto.ts class-validator
    │   └── update-book.dto.ts PartialType(CreateBookDto)
    └── entities/book.entity.ts  interface / class Book
```

CLI to vygeneruje: `nest g resource books` (controller + service + module + DTO).
Na pohovoru se zeptej, jestli smíš CLI použít — ušetří 5 minut.

Pořadí psaní, které funguje pod tlakem:

1. **Entity + DTO** (tvar dat — zbytek se od nich odvíjí).
2. **Service** s `Map` a výjimkami (testovatelné bez HTTP).
3. **Controller** — tenká vrstva, jen deleguje.
4. **Module** + registrace v `AppModule`.
5. `ValidationPipe` v `main.ts` — **nezapomeň**, jinak validace mlčky neběží.
6. Jeden e2e test (`supertest`) na happy path a na 404.

## 11. Srovnání Go ↔ Nest jednou tabulkou

| Úkol | Go (`net/http`) | Nest |
|---|---|---|
| route | `mux.HandleFunc("GET /books/{id}", h)` | `@Get(':id')` na metodě |
| path param | `r.PathValue("id")` + `strconv.Atoi` | `@Param('id', ParseIntPipe)` |
| JSON body | `json.NewDecoder(r.Body).Decode(&req)` | `@Body() dto: CreateBookDto` |
| validace | ručně / `go-playground/validator` | `class-validator` + `ValidationPipe` |
| odpověď | `json.NewEncoder(w).Encode(v)` | `return v` |
| chyba → status | `http.Error(w, msg, 404)` | `throw new NotFoundException(msg)` |
| závislosti | konstruktory volané v `main()` | `@Injectable` + `providers` + konstruktor |
| abstrakce | interface na straně konzumenta | custom token + `@Inject` / abstraktní třída |
| test | `httptest.NewRecorder()` | `Test.createTestingModule` + `supertest` (D6) |

## Věty na pohovor

- *„Controller je tenký — routing, parsování a validace vstupu. Logika je v
  service, protože tu otestuju bez HTTP."*
- *„DTO je třída, ne interface, protože validace a transformace běží za běhu
  a interface za běhu neexistuje."*
- *„`whitelist: true` mám vždycky — jinak riskuju mass assignment."*
- *„Providery jsou default singletony — stav v service sdílí všechny requesty,
  takže tam nedávám nic request-specifického."*
- *„`Nest can't resolve dependencies ... at index [0]` = chybí provider v
  kontextu modulu — skoro vždy chybí export nebo import."*

---

## Kontrolní otázky

1. Proč Nest DI nefunguje s parametrem typu `interface` a co uděláš místo toho?
   Co se stane, když appku spustíš přes `tsx` / esbuild?
2. `@Get(':id') get(@Param('id') id: number)` a v service `this.map.get(id)`
   vrací vždycky `undefined`. Proč? Uveď dvě opravy.
3. Klient pošle `POST /books` s polem `"price": 0` navíc, které v DTO není.
   Co se stane bez `whitelist`, s `whitelist` a s `forbidNonWhitelisted`?

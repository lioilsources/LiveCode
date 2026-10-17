# D1 — TypeScript pro Go vývojáře

> TypeScript je **JavaScript s typy, které se při kompilaci smažou**. Za běhu
> zbyde čistý JS — žádné typy, žádné interfaces, žádné `instanceof Interface`.
> Když tohle pochopíš první den, ušetříš si půlku zmatků v Nestu (proč DTO
> musí být třídy, proč validace běží za běhu, proč DI token není interface).

## 0. Mentální model za 60 sekund

| | Go | Dart | TypeScript |
|---|---|---|---|
| Typy za běhu | ✅ (reflect, type switch) | ✅ (`is`, reified generics) | ❌ **smazané** (type erasure) |
| Interface splnění | implicitní (strukturální) | explicitní (`implements`) | **implicitní (strukturální)** — i pro třídy |
| Null | `nil` | `null` + null safety | `null` **i** `undefined` + `strictNullChecks` |
| Chyby | hodnota `error` | výjimky | výjimky — `throw` **čehokoli** |
| Souběh | goroutiny | isolates + event loop | 1 vlákno + event loop (D3) |

**Analogie:** TS je **lešení kolem stavby**. Pomáhá ti stavět rovně (kompilátor),
ale před otevřením budovy se celé rozebere. Co potřebuješ hlídat za provozu
(vstup z HTTP), musíš hlídat **jinak** — runtime validací.

## 1. Structural typing — „tvar, ne rodokmen"

Z Go to znáš: typ splňuje interface, když **má ty metody**. TS jde dál: platí to
pro **všechno** — objekty, třídy, funkce. Kompilátor porovnává **tvar** (jména
a typy properties), nikdy jméno typu.

```ts
interface Point { x: number; y: number }

class Vec { constructor(public x: number, public y: number) {} }

function len(p: Point): number { return Math.hypot(p.x, p.y); }

len({ x: 3, y: 4 });        // ✅ literál má tvar Point
len(new Vec(3, 4));         // ✅ Vec nikde neříká "implements Point" — a pasuje
const p3 = { x: 1, y: 2, z: 3 };
len(p3);                    // ✅ víc properties nevadí (podtyp)
```

Rozdíl proti Go: v Go se to týká jen **interfaces**. V TS i **dvě různé třídy**
se stejným tvarem jsou zaměnitelné:

```ts
class UserId { constructor(public value: string) {} }
class OrderId { constructor(public value: string) {} }
const u: UserId = new OrderId('o-1');   // ✅ projde! Stejný tvar = stejný typ.
```

> Chceš „nominální" typy (jako `type UserID string` v Go)? Použij **branded type**:
> `type UserId = string & { readonly __brand: 'UserId' }`. Na pohovoru stačí vědět,
> že to existuje.

### Excess property check — jediná výjimka

**Čerstvý objektový literál** přiřazený přímo do typu nesmí mít properties navíc:

```ts
len({ x: 1, y: 2, z: 3 });  // ❌ Object literal may only specify known properties
const tmp = { x: 1, y: 2, z: 3 };
len(tmp);                   // ✅ přes proměnnou už to projde
```

Proč: literál napsaný na místě s překlepem (`{ nmae: 'x' }`) je skoro vždycky bug.
Je to **lint v kompilátoru**, ne pravidlo typového systému.

> Věta na pohovor: **„TS je strukturálně typovaný — kompatibilita se posuzuje podle
> tvaru, ne podle jména. Jako Go interfaces, ale pro všechny typy včetně tříd."**

## 2. `type` vs. `interface`

Obojí popíše tvar objektu. Rozdíly, na které se ptají:

| | `interface` | `type` alias |
|---|---|---|
| Tvar objektu | ✅ | ✅ |
| Union `A \| B`, literály, tuple, primitivum | ❌ | ✅ |
| Rozšíření | `extends` | `&` (intersection) |
| **Declaration merging** | ✅ dvě deklarace se sloučí | ❌ chyba „Duplicate identifier" |
| `class X implements …` | ✅ | ✅ (pokud je to objektový tvar) |

```ts
interface User { id: string }
interface User { name: string }     // merging: User má teď id i name
// používá se k rozšiřování cizích typů, např. Express Request:
// declare global { namespace Express { interface Request { user?: AuthUser } } }

type Status = 'active' | 'banned';  // union — interface to neumí
type Admin = User & { role: 'admin' };
```

**Pravidlo palce:** `interface` pro tvary objektů a veřejná API (lepší hlášky,
merging), `type` pro uniony, literály a složeniny. Na pohovoru: vyber jedno a buď
konzistentní — obojí je OK.

## 3. Primitiva a literal types

`string`, `number` (jen **jeden** číselný typ — float64; žádný `int32`!),
`bigint`, `boolean`, `null`, `undefined`, `symbol`.

```ts
0.1 + 0.2 === 0.3            // false — stejně jako float64 v Go
Number.MAX_SAFE_INTEGER       // 2^53 - 1 → větší ID (int64 z DB!) posílej jako string
Number.isInteger(5.0)         // true
```

**Literal types** — hodnota jako typ:

```ts
type Method = 'GET' | 'POST';
let m: Method = 'GET';       // ✅
m = 'PUT';                   // ❌

let a = 'GET';               // typ: string   (let → rozšíří se)
const b = 'GET';             // typ: 'GET'    (const → zůstane literál)
```

## 4. Union + narrowing

Union `A | B` = hodnota je jedno z toho. Než použiješ něco specifického, musíš
**zúžit** (narrowing). Kompilátor sleduje řídicí tok:

| Ochrana | Na co | Příklad |
|---|---|---|
| `typeof` | primitiva | `typeof x === 'string'` |
| `instanceof` | **třídy** (za běhu existují) | `e instanceof HttpError` |
| `in` | přítomnost property | `'swim' in animal` |
| rovnost | literály, null | `x === null`, `s.kind === 'circle'` |
| truthiness | null/undefined/'' /0 | `if (name) …` ⚠️ zahodí i `''` a `0` |

```ts
function fmt(v: string | number | Date): string {
  if (typeof v === 'string') return v.toUpperCase();   // v: string
  if (typeof v === 'number') return v.toFixed(2);      // v: number
  return v.toISOString();                              // v: Date
}
```

⚠️ `typeof null === 'object'` (historická chyba JS). A `instanceof` **nefunguje
na interface ani type** — za běhu neexistují.

## 5. Discriminated union + `never` = sealed interface + type switch

V Go děláš „sealed" interface s neexportovanou metodou a type switch — a
kompilátor ti **neřekne**, že jsi zapomněl větev. V TS to dělá **lépe**:

```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number }
  | { kind: 'square'; side: number };

function area(s: Shape): number {
  switch (s.kind) {            // s.kind je "diskriminátor" (literal type)
    case 'circle': return Math.PI * s.r ** 2;   // tady s: {kind:'circle', r}
    case 'rect':   return s.w * s.h;
    case 'square': return s.side ** 2;
    default:       return assertNever(s);      // s: never — pokud jsou pokryté všechny
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}
```

Přidáš `| { kind: 'triangle'; … }` → **compile error** v `default`:
`Argument of type '{ kind: "triangle" … }' is not assignable to parameter of type 'never'`.
To je **exhaustiveness check** — přesně to, co v Go type switchi chybí.

> Věta na pohovor: **„Stavy modeluju jako discriminated union s `kind` a v switchi
> dávám `assertNever` do defaultu — přidání nové varianty pak rozbije build na
> všech místech, kde ji nezpracuju."**

Analogie Dart 3: `sealed class` + `switch` expression je to samé, jen nominálně.

## 6. `any` vs. `unknown` vs. `never`

| Typ | Co znamená | Co s ním smíš | Go analogie |
|---|---|---|---|
| `any` | „vypni typovou kontrolu" | cokoli — a nakazí okolí | nic takového (horší než `interface{}`) |
| `unknown` | „něco, nevím co" | **nic**, dokud nezúžíš | `any` / `interface{}` + nutný type switch |
| `never` | „nemůže nastat" | — | funkce, která vždy panikaří |

```ts
const data: unknown = JSON.parse(body);
data.name;                                  // ❌ 'data' is of type 'unknown'
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log(data.name);                   // ✅ zúženo
}
```

**Pravidlo:** všechno, co přijde zvenku (`JSON.parse`, `req.body`, `catch (e)`),
je `unknown`. `any` na pohovoru = červená vlajka. `as Foo` (type assertion) je
**lež kompilátoru** — nic neověří za běhu.

## 7. `null` vs. `undefined`

JS má dvě „nic". Konvence:

- `undefined` — „nenastaveno": chybějící property, nepředaný parametr, funkce bez `return`.
- `null` — „explicitně prázdné": typicky z DB / JSON (`"deletedAt": null`).

S `strict` (resp. `strictNullChecks`) je `string` **opravdu jen string** — `null`
musíš povolit: `string | null`. Stejný princip jako Dart null safety (`String?`).

### Optional chaining a nullish coalescing

```ts
user?.address?.city           // undefined, pokud cokoli v řetězu je null/undefined
user.getName?.()              // zavolá, jen pokud metoda existuje

const port = cfg.port ?? 3000;   // ?? bere default jen pro null/undefined
const port2 = cfg.port || 3000;  // ⚠️ || bere default i pro 0, '', false, NaN
```

🧨 **Past:** `limit || 10` při `limit = 0` vrátí 10. `name || 'anon'` při `''`
vrátí `'anon'`. Na číslech a stringech, kde 0/'' je platná hodnota, **vždy `??`**.

### Optional property vs. `| undefined`

```ts
interface A { nick?: string }             // property smí CHYBĚT
interface B { nick: string | undefined }  // property MUSÍ být, smí být undefined

const a: A = {};                 // ✅
const b: B = {};                 // ❌ Property 'nick' is missing
const b2: B = { nick: undefined }; // ✅
```

Prakticky: `?` u nepovinných polí DTO. `| undefined` když chceš přinutit volajícího
o hodnotě rozhodnout.

## 8. `readonly`

```ts
interface Config { readonly url: string; readonly tags: readonly string[] }
cfg.url = 'x';          // ❌
cfg.tags.push('a');     // ❌ readonly string[] nemá push
```

⚠️ `readonly` je **jen compile-time** a **mělký**: `readonly user: User` nebrání
`cfg.user.name = 'x'`. Za běhu zmrazí jen `Object.freeze` (taky mělce).
`const` ≠ immutabilita: `const arr = []; arr.push(1)` projde — `const` jen zakazuje
přiřadit do proměnné znovu.

## 9. Třídy — tohle potřebuješ pro Nest

Třídy v TS jsou **skutečné JS třídy** — za běhu existují (na rozdíl od interfaces).
Proto je Nest používá na všechno.

```ts
interface Repo { find(id: string): User | undefined }

class UserService {
  private cache = new Map<string, User>();     // pole s inicializátorem

  // ⭐ PARAMETER PROPERTIES: modifikátor u parametru konstruktoru
  //    = deklaruje pole + přiřadí. Tohle uvidíš v KAŽDÉ Nest službě.
  constructor(private readonly repo: Repo, protected readonly ttlMs = 60_000) {}

  get(id: string): User {
    const u = this.repo.find(id);
    if (!u) throw new Error(`user ${id} not found`);
    return u;
  }
}
```

Ekvivalent bez zkratky:

```ts
class UserService {
  private readonly repo: Repo;
  constructor(repo: Repo) { this.repo = repo; }
}
```

| Modifikátor | Význam | Za běhu |
|---|---|---|
| `public` (default) | odkudkoli | — |
| `protected` | třída + potomci | — |
| `private` | jen třída | ⚠️ **jen compile-time** — `(svc as any).repo` projde |
| `#field` | JS private | ✅ opravdu nepřístupné |
| `readonly` | jen v konstruktoru | — |

### `implements` a `abstract`

```ts
interface Notifier { send(to: string, msg: string): Promise<void> }

class EmailNotifier implements Notifier {      // implements = jen kontrola tvaru,
  async send(to: string, msg: string) { … }    // nic nedědí, za běhu nic nedělá
}

abstract class BaseRepo<T> {                   // abstract třída = sdílený kód + díry
  protected items = new Map<string, T>();
  abstract validate(item: T): void;            // potomek MUSÍ implementovat
  save(id: string, item: T) { this.validate(item); this.items.set(id, item); }
}
```

`implements` je v TS **nepovinné** (strukturální typing) — slouží jako dokumentace
a kontrola v místě deklarace, stejně jako Go idiom `var _ Shape = (*Circle)(nil)`.

⚠️ **`this` past:** metoda předaná jako callback ztratí `this`:
`setTimeout(svc.tick, 100)` → `this` je `undefined`. Fix: arrow funkce
`setTimeout(() => svc.tick(), 100)` nebo arrow property `tick = () => { … }`.

## 10. Typy za běhu NEEXISTUJÍ 🧨

Tohle je nejdůležitější sekce dne. TS kompilátor typy **smaže**:

```ts
interface CreateUserDto { email: string; age: number }

@Post()
create(@Body() dto: CreateUserDto) {
  // dto je to, co poslal klient. Klidně { email: 42, hack: true }.
  // TS ti NIC neověřil — typ je jen slib, ne kontrola.
}
```

Důsledky, které musíš umět vysvětlit:

1. **Nejde `x instanceof CreateUserDto`**, když je to interface — za běhu neexistuje.
2. **Validace vstupu musí být runtime kód.** V Nestu: DTO jako **třída** s dekorátory
   z `class-validator` (`@IsEmail()`, `@IsInt()`) + `ValidationPipe`. Třída za běhu
   existuje → dekorátory k ní můžou připnout metadata → pipe podle nich validuje.
   Alternativa mimo Nest: **zod** (`z.object({...})` + `z.infer<typeof schema>`).
3. **DI token nemůže být interface.** Nest pozná, co injectnout, podle typu
   parametru konstruktoru — a ten za běhu zbyde jen pro třídy (`emitDecoratorMetadata`).
   Pro interface potřebuješ string/symbol token + `@Inject(TOKEN)` (D4).
4. **`as` nic nekontroluje.** `JSON.parse(s) as User` je lež, ne konverze.

Srovnání: v Go `json.Unmarshal` do structu aspoň ověří typy polí. V TS
`JSON.parse` vrátí `any` a typ, který mu přilepíš, je jen přání.

> Věta na pohovor: **„Typy v TS jsou compile-time only. Na hranici systému — HTTP
> body, zprávy z fronty, env proměnné — validuju za běhu, v Nestu přes class-validator
> DTO a ValidationPipe, jinde přes zod."**

## 11. Funkce — rychlý přehled syntaxe

```ts
function add(a: number, b = 0, ...rest: number[]): number { … }   // default, rest
const mul = (a: number, b: number): number => a * b;              // arrow
type Handler = (req: Request) => Promise<Response>;               // function type

function parse(x: string): number;                                // overloady
function parse(x: string[]): number[];
function parse(x: string | string[]) { … }
```

Návratový typ u exportovaných funkcí piš explicitně — lepší chyby a čitelnost.

## 12. Tahák pastí

| Past | Správně |
|---|---|
| `x \|\| default` u čísel/stringů | `x ?? default` |
| `typeof null === 'object'` | `x !== null && typeof x === 'object'` |
| `instanceof SomeInterface` | `in` / diskriminátor / type guard (D2) |
| `JSON.parse(s) as User` | runtime validace (class-validator, zod) |
| `==` | vždy `===` (`'' == 0` je `true`) |
| `private` jako bezpečnost | jen compile-time; `#x` je skutečné private |
| metoda jako callback ztratí `this` | arrow funkce |
| `const` = immutable | jen nepřiřaditelná proměnná |
| velká čísla (int64 ID) | posílej jako `string` nebo `bigint` |

## Kontrolní otázky

1. Proč v TS projde `const u: UserId = new OrderId('x')` a jak bys dosáhl, aby
   neprošlo? Kdy naopak TS přidání properties navíc **odmítne**?
2. Máš `type Event = Paid | Refunded | Failed` se `switch (e.kind)`. Kolega přidá
   `Disputed`. Jak zařídíš, aby build spadl na všech místech, kde se nezpracuje?
   Čím je to lepší než Go type switch?
3. Proč Nest DTO píšeš jako `class` s dekorátory, a ne jako `interface`? Co přesně
   by se stalo s `interface CreateUserDto`, kdyby klient poslal `{ "age": "abc" }`?

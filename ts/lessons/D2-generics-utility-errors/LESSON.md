# D2 — Generika, utility types, chyby a kolekce

> Včera tvary, dnes **skládání tvarů**. Na live codingu v Nestu budeš psát
> `CreateDto`, `UpdateDto = Partial<CreateDto>`, generický repozitář a vlastní
> chyby. A u každé „rychlé" úlohy narazíš na `sort`, `Map` a `reduce`.
> Tohle je den, kdy se TS začne psát rychle.

## 1. Generika — známé z Go, jen jiná syntaxe

| Go | TS |
|---|---|
| `func Map[T, U any](xs []T, f func(T) U) []U` | `function map<T, U>(xs: T[], f: (x: T) => U): U[]` |
| `[T comparable]` | `<T extends string \| number>` (žádné `comparable`) |
| `[T cmp.Ordered]` | `<T extends number \| string>` |
| `[T interface{ ID() string }]` | `<T extends { id: string }>` |
| `type Stack[T any] struct{…}` | `class Stack<T> { … }` |
| `var zero T` | ❌ nejde — typ za běhu neexistuje (vrať `undefined`) |
| metody s vlastními type params ❌ | ✅ metody **můžou** mít vlastní `<U>` |

```ts
function first<T>(xs: readonly T[]): T | undefined {
  return xs[0];                    // s noUncheckedIndexedAccess je xs[0] typu T | undefined
}

first([1, 2, 3]);                  // T odvozeno = number
first<string>([]);                 // explicitně
```

### Constraints přes `extends`

`extends` v generice znamená **„musí mít aspoň tenhle tvar"** (structural!), ne dědičnost:

```ts
function byId<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((i) => i.id === id);       // smím sáhnout na i.id
}
byId([{ id: 'a', name: 'Ann' }], 'a');         // vrací {id, name} — T si drží celý tvar
```

Rozdíl proti `function byId(items: {id: string}[])`: generická verze **vrátí
původní typ** (`{id, name}`), ne ořezaný `{id}`.

### `keyof` a `T[K]` — typově bezpečný přístup k poli

```ts
type User = { id: string; age: number };
type K = keyof User;                     // 'id' | 'age'
type A = User['age'];                    // number

function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((i) => i[key]);
}
pluck(users, 'age');                     // number[]
pluck(users, 'agee');                    // ❌ compile error — překlep v klíči chytí kompilátor
```

Tohle v Go neuděláš (bez reflexe). V TS je to denní chleba — `sortBy(users, 'age')`,
`groupBy(orders, 'status')`.

### Generické třídy a default type params

```ts
class Cache<K, V = string> {             // default jako u funkčních parametrů
  private m = new Map<K, V>();
  get(k: K): V | undefined { return this.m.get(k); }
  set(k: K, v: V): this { this.m.set(k, v); return this; }
}
const c = new Cache<string>();           // V = string
```

## 2. Utility types — proč existují (DTO!)

Nejčastější použití v Nestu: **jeden zdrojový typ, z něj odvozené DTO**:

```ts
interface Product { id: string; name: string; price: number; createdAt: Date }

type CreateProduct = Omit<Product, 'id' | 'createdAt'>;  // klient id neposílá
type UpdateProduct = Partial<CreateProduct>;             // PATCH: všechno nepovinné
type ProductPreview = Pick<Product, 'id' | 'name'>;
type ById = Record<string, Product>;                     // slovník
```

| Utility | Co dělá | Typické použití |
|---|---|---|
| `Partial<T>` | všechna pole `?` | PATCH / update DTO |
| `Required<T>` | všechna pole povinná | konfigurace po doplnění defaultů |
| `Readonly<T>` | všechna pole `readonly` | immutable state, config |
| `Pick<T, K>` | jen vybraná pole | response / preview |
| `Omit<T, K>` | bez vybraných polí | create DTO bez `id` |
| `Record<K, V>` | objekt s klíči `K` a hodnotami `V` | lookup tabulky, `Record<Status, number>` |
| `ReturnType<F>` | návratový typ funkce | typ z továrny / configu |
| `Parameters<F>` | tuple parametrů | wrappery, `retry(fn, ...args)` |
| `Awaited<T>` | rozbalí Promise | `Awaited<ReturnType<typeof fetchUser>>` |
| `NonNullable<T>` | odebere `null \| undefined` | po filtraci |

> V Nestu jsou **runtime** verze: `PartialType(CreateDto)`, `PickType`, `OmitType`
> z `@nestjs/mapped-types` — vytvoří **třídu** i s validačními dekorátory (D4).
> TS `Partial<…>` je jen typ a za běhu nic neudělá.

Trik: `Record<Status, number>` donutí vyplnit **všechny** klíče — exhaustiveness pro objekty:

```ts
type Status = 'open' | 'closed';
const labels: Record<Status, string> = { open: 'Otevřeno' }; // ❌ chybí 'closed'
```

## 3. Mapped & conditional types — jen umět přečíst

Na pohovoru je psát nebudeš, ale musíš je přečíst v knihovnách:

```ts
// mapped: projdi klíče a transformuj
type MyPartial<T> = { [K in keyof T]?: T[K] };
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };

// conditional: if na úrovni typů
type IsString<T> = T extends string ? true : false;
type ElementOf<T> = T extends (infer E)[] ? E : never;   // infer = "vytáhni typ"
type MyAwaited<T> = T extends Promise<infer V> ? V : T;
```

**Pravidlo pro pohovor:** pokud píšeš conditional type v live codingu, nejspíš
přeháníš. Utility types ze std stačí na 95 %.

## 4. Type guards a assertion functions

Z D1 víš, že `instanceof` na interface nefunguje. Vlastní ochrana:

```ts
// type predicate: true ⇒ kompilátor zúží na T
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'id' in x && typeof x.id === 'string';
}

// assertion function: buď projde, nebo hodí — za ní je x zúžené
function assertUser(x: unknown): asserts x is User {
  if (!isUser(x)) throw new ValidationError('not a user');
}

const data: unknown = JSON.parse(body);
assertUser(data);
data.id;                                      // ✅ odsud je data: User
```

Hodí se i na filtraci:

```ts
const ids = ['a', null, 'b', undefined];
const clean = ids.filter((x): x is string => x != null);   // string[]
// TS 5.5+ odvodí predikát i z `ids.filter((x) => x != null)` sám.
```

⚠️ Type guard je **slib, který kompilátor nekontroluje**. Napíšeš-li `return true`,
TS ti uvěří. Guardy proto testuj.

## 5. `as const` a `satisfies`

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const;   // readonly ['admin','editor','viewer']
type Role = (typeof ROLES)[number];                      // 'admin' | 'editor' | 'viewer'
// ⭐ jeden zdroj pravdy: pole pro runtime (validace @IsIn(ROLES)) + typ pro compile-time
```

`satisfies` = „zkontroluj, že to odpovídá typu, ale **nech mi přesný typ**":

```ts
const routes = {
  users: '/api/users',
  orders: '/api/orders',
} satisfies Record<string, `/api/${string}`>;

routes.users;          // typ '/api/users' — klíče zůstaly známé
routes.typo;           // ❌ chyba — kdyby bylo `: Record<string, …>`, prošlo by to (string klíč)
```

| | `const x: T = …` | `const x = … satisfies T` | `const x = … as T` |
|---|---|---|---|
| Kontrola proti `T` | ✅ | ✅ | ❌ (jen hrubá) |
| Výsledný typ | `T` (rozšíří) | **přesný** odvozený | `T` |
| Kdy | API hranice | konfigurace, lookup tabulky | skoro nikdy |

## 6. `enum` vs. union literálů

```ts
enum Status { Active = 'active', Banned = 'banned' }     // generuje runtime objekt
type Status2 = 'active' | 'banned';                        // jen typ, 0 runtime
const STATUSES = ['active', 'banned'] as const;           // + runtime pole, když ho chceš
```

**Doporučení:** union literálů (+ `as const` pole, když potřebuješ výčet za běhu).
Enumy jsou jediná TS fičura s runtime kódem, číselné enumy přijmou libovolné číslo
a s `--erasableSyntaxOnly` / Node type-stripping nejdou spustit. V Nest projektech
enumy ale uvidíš (Swagger, TypeORM) — číst je musíš umět; pokud už jsou v kódu,
drž se konvence projektu. Nikdy nepoužívej **číselné** enumy bez explicitních hodnot.

## 7. Chyby — „throw cokoli" svět

V Go je chyba **hodnota** v návratu. V JS/TS je to **výjimka** — a hodit jde cokoli:

```ts
throw 'oops';                 // ✅ legální, ❌ zlo (žádný stack trace)
throw { code: 42 };           // ✅ legální, ❌ zlo
throw new Error('oops');      // ✅ správně
```

Proto je v `catch` proměnná **`unknown`** (se `strict` / `useUnknownInCatchVariables`):

```ts
try { … } catch (e) {          // e: unknown
  e.message;                   // ❌
  if (e instanceof Error) log(e.message);        // ✅
  else log(String(e));
}
```

### Vlastní chybové třídy

```ts
export class NotFoundError extends Error {
  constructor(
    public readonly entity: string,
    public readonly id: string,
    options?: { cause?: unknown },
  ) {
    super(`${entity} ${id} not found`, options);   // cause = Go `%w` wrapping
    this.name = 'NotFoundError';                   // jinak ve stacku "Error"
  }
}

try { await repo.get(id); }
catch (e) {
  if (e instanceof NotFoundError) return null;     // ≈ errors.As
  throw new Error('loading order failed', { cause: e });  // ≈ fmt.Errorf("...: %w", err)
}
```

| Go | TS |
|---|---|
| `errors.New("x")` | `new Error('x')` |
| `fmt.Errorf("ctx: %w", err)` | `new Error('ctx', { cause: err })` |
| `errors.As(err, &target)` | `err instanceof MyError` (třídy za běhu existují ✅) |
| `errors.Is(err, ErrNotFound)` | `err instanceof NotFoundError` / `err.code === 'NOT_FOUND'` |
| sentinel error | třída nebo `code` property |

⚠️ `instanceof` funguje, protože třídy jsou runtime. Pozor jen na chyby přes
hranice realmů/duplikátní kopie balíku v `node_modules` — tam radši `name`/`code`.

### Result pattern — Go styl v TS

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parsePort(s: string): Result<number, string> {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 && n < 65536
    ? { ok: true, value: n }
    : { ok: false, error: `invalid port: ${s}` };
}

const r = parsePort(env.PORT ?? '');
if (!r.ok) throw new Error(r.error);
r.value;                                  // number — discriminated union z D1!
```

**Kdy co:** výjimky pro „neočekávané" a pro framework (Nest mapuje `HttpException`
na HTTP status — D4). Result pro **očekávané** neúspěchy v doménové logice (parsování,
validace, business pravidla), kde chceš, aby volající chybu *musel* ošetřit.
Na pohovoru: v Nestu hází služby `NotFoundException` — nejdi proti frameworku.

> Věta na pohovor: **„V catch je chyba `unknown` — zužuju přes `instanceof`.
> Vlastní chyby jsou třídy s `name` a `cause`, wrapping přes `{ cause }` jako `%w`
> v Go. Pro očekávané neúspěchy v doméně používám Result union."**

## 8. Kolekce — pole, `Map`, `Set`

### Array metody (Go píšeš smyčkou, TS řetězem)

```ts
const orders = [{ id: 'a', total: 120, status: 'paid' }, …];

orders.filter((o) => o.status === 'paid')       // nové pole
      .map((o) => o.total)                       // nové pole
      .reduce((sum, t) => sum + t, 0);           // ⚠️ VŽDY dej počáteční hodnotu

orders.find((o) => o.id === 'a');               // T | undefined
orders.findIndex(…), orders.some(…), orders.every(…), orders.includes(x)
orders.flatMap((o) => o.items);                 // map + flatten o 1 úroveň
orders.at(-1);                                   // poslední prvek
```

⚠️ `reduce` bez počáteční hodnoty na prázdném poli **hodí TypeError**.

### 🧨 `sort` — dvě pasti

```ts
[10, 9, 1, 100].sort();                // [1, 10, 100, 9]  ← LEXIKOGRAFICKY (jako stringy)!
[10, 9, 1, 100].sort((a, b) => a - b); // [1, 9, 10, 100]  ✅

const sorted = arr.sort(cmp);          // ⚠️ MUTUJE arr a vrací TU SAMOU referenci
const sorted2 = arr.toSorted(cmp);     // ✅ ES2023: nové pole (také toReversed, toSpliced, with)
const sorted3 = [...arr].sort(cmp);    // ✅ starší způsob
```

Komparátor vrací číslo: `< 0` a dřív, `> 0` b dřív, `0` stejné. Víc klíčů:

```ts
users.toSorted((a, b) =>
  b.score - a.score ||                 // primárně score sestupně
  a.name.localeCompare(b.name));       // sekundárně jméno vzestupně (0 || …)
```

`sort` je od ES2019 **stabilní** (zachová pořadí stejných prvků).

### `Map` / `Set` vs. objekt

| | `{}` / `Record` | `Map` |
|---|---|---|
| Klíče | jen string/symbol (`1` → `'1'`) | **cokoli** (objekty, čísla) |
| Pořadí | složité (čísla napřed) | pořadí vložení |
| Velikost | `Object.keys(o).length` | `m.size` |
| Prototyp | ⚠️ `'constructor' in {}` je `true` | čistý |
| JSON | ✅ přímo | ❌ `Object.fromEntries(m)` |

**Pravidlo:** dynamické klíče, počítání, cache → `Map`. Pevný tvar a JSON → objekt.

```ts
const freq = new Map<string, number>();
for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);   // Go: freq[w]++

const seen = new Set<string>();
if (seen.has(id)) continue; seen.add(id);
const unique = [...new Set(ids)];
```

⚠️ Klíče `Map`/`Set` se porovnávají **referencí** (`SameValueZero`): `new Set([{a:1},{a:1}]).size === 2`.
Složený klíč → string: `` `${userId}:${day}` ``.

### `for…of` vs. `for…in` 🧨

```ts
for (const x of [10, 20]) …     // hodnoty: 10, 20       ✅ pro pole, Map, Set, string
for (const i in [10, 20]) …     // KLÍČE jako stringy: '0', '1'  ❌ na pole nepoužívej
for (const [k, v] of map) …     // Map entries
for (const [k, v] of Object.entries(obj)) …   // objekt
for (const [i, x] of arr.entries()) …         // index + hodnota (Go `for i, x := range`)
```

### groupBy

```ts
// Node 21+ / ES2024 — potřebuje "lib": ["ES2024"] v tsconfig
const byStatus = Object.groupBy(orders, (o) => o.status);  // Partial<Record<…, Order[]>>
const byStatusMap = Map.groupBy(orders, (o) => o.status);  // Map<…, Order[]>

// ruční verze, kterou napíšeš na pohovoru za 30 s:
const groups = new Map<string, Order[]>();
for (const o of orders) {
  const g = groups.get(o.status);
  if (g) g.push(o); else groups.set(o.status, [o]);
}
```

## 9. Destructuring, spread a mělké kopie

```ts
const { id, ...rest } = user;              // rest = vše kromě id (Omit za běhu!)
const { name = 'anon' } = input;           // default
const [head, ...tail] = items;
function create({ title, done = false }: CreateTodo) { … }

const updated = { ...todo, ...patch };     // merge — pozdější vyhrává
const copy = [...arr];
```

🧨 **Spread je MĚLKÝ.** Vnořené objekty/pole se sdílí:

```ts
const a = { tags: ['x'], meta: { v: 1 } };
const b = { ...a };
b.tags.push('y');            // a.tags je teď ['x', 'y'] !
b.meta.v = 2;                // a.meta.v === 2 !
const deep = structuredClone(a);   // ✅ hluboká kopie (Node 17+); neumí funkce/třídy
```

🧨 **Spread `undefined` přepíše:** `{ ...todo, ...{ title: undefined } }` → `title: undefined`.
U PATCH proto filtruj `undefined` hodnoty (nebo použij `ValidationPipe` se
`skipMissingProperties`). Tohle je klasický bug v update endpointu.

## 10. Tahák pastí

| Past | Správně |
|---|---|
| `[10, 9, 1].sort()` | `.sort((a, b) => a - b)` |
| `arr.sort()` vrací nové pole? | mutuje → `toSorted` / `[...arr].sort` |
| `reduce` bez init | vždy `reduce(fn, init)` |
| `for (i in arr)` | `for (const x of arr)` / `arr.entries()` |
| `{}` jako mapa s čísly/objekty | `Map` |
| `Set` objektů dedupuje podle obsahu? | podle reference → klíč jako string |
| spread = hluboká kopie | mělká → `structuredClone` |
| `{ ...a, ...patch }` s `undefined` | odfiltruj `undefined` |
| `catch (e) { e.message }` | `e instanceof Error ? e.message : String(e)` |
| `throw 'string'` | `throw new Error(…)` |
| číselný `enum` | union literálů / `as const` |
| `as User` po `JSON.parse` | type guard / assertion function / zod |

## Kontrolní otázky

1. Jaký je rozdíl mezi `function byId(items: { id: string }[], id: string)` a
   `function byId<T extends { id: string }>(items: T[], id: string): T | undefined`?
   K čemu je `K extends keyof T` v `sortBy(items, 'age')`?
2. Co vypíše `[10, 1, 5, 100].sort()` a co se stane s původním polem? Napiš řazení
   uživatelů podle `score` sestupně a při shodě podle `name` vzestupně, bez mutace.
3. Jak v TS napíšeš ekvivalent Go `fmt.Errorf("load: %w", err)` a `errors.As`?
   Proč je v `catch (e)` typ `unknown` a kdy bys místo výjimky použil `Result`?

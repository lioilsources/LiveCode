# Drills D1 — TS syntaxe do prstů

> Nejsou na pochopení, ale na **psaní**. Každý je malý, píše se z prázdné stránky
> a má test. Cíl: napsat tvar **bez přemýšlení nad syntaxí**, aby ti na live codingu
> zbyla hlava na problém, ne na to, kam patří dvojtečka.

## Jak drilovat

1. Otevři `drill.ts` — je **prázdný** (jen zadání v komentáři).
2. Napiš řešení **bez koukání** do LESSON.md a bez kopírování z předchozího drillu.
3. Spusť test. Dokud soubor nic neexportuje, test spadne na
   `File '.../drill.ts' is not a module` / `has no exported member` — to je v pořádku.
4. Po dokončení všech šesti **smaž obsah a projeď je znovu**. Cíl: každý do 3 minut,
   třetí kolo naslepo.

```bash
npx jest lessons/D1-ts-basics/drills/01     # jeden drill
npx jest lessons/D1-ts-basics/drills        # všechny
npx jest lessons/D1-ts-basics/drills --watch # piš a sleduj
```

| # | Drill | Sval |
|---|---|---|
| 01 | interface-type | `export interface`, `?:`, literal union, template string |
| 02 | narrowing | `typeof`, `instanceof`, `== null` |
| 03 | discriminated-union | `kind`, `switch`, `assertNever(x: never)` |
| 04 | nullish | `??` vs `\|\|`, `?.` |
| 05 | class-di | `constructor(private readonly repo: Repo)`, `implements`, `Map` |
| 06 | unknown-guard | `x is T`, validace `unknown`, whitelist polí |

## 6 tvarů, které chceš mít v prstech

Přečti jednou, pak zavři a piš.

```ts
// 1) Interface + union literálů + nepovinné pole
export type Role = 'admin' | 'viewer';
export interface User { id: string; role: Role; email?: string }

// 2) Narrowing
if (v == null) return '-';                // null i undefined
if (typeof v === 'string') return v.trim();
if (v instanceof Date) return v.toISOString();

// 3) Discriminated union + exhaustiveness
type Ev = { kind: 'a'; x: number } | { kind: 'b'; y: string };
function f(e: Ev) {
  switch (e.kind) {
    case 'a': return e.x;
    case 'b': return e.y.length;
    default:  return assertNever(e);
  }
}
function assertNever(x: never): never { throw new Error(`unhandled ${JSON.stringify(x)}`); }

// 4) Defaulty
const limit = q.limit ?? 20;              // ne ||
const city = o?.customer?.address?.city ?? 'unknown';

// 5) Služba s injektovanou závislostí
export class TodoService {
  private nextId = 1;
  constructor(private readonly repo: TodoRepo) {}
}

// 6) Type guard nad unknown
function isX(x: unknown): x is X {
  return typeof x === 'object' && x !== null && 'id' in x && typeof x.id === 'string';
}
```

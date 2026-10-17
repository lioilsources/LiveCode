# Drills D2 — generika, DTO, chyby, kolekce do prstů

> Stejná metodika jako D1: prázdný `drill.ts`, zadání v komentáři, test. Piš
> **bez koukání**, pak smaž a znovu. Tyhle tvary napíšeš na každém live codingu
> (`Partial<Dto>`, `class XError extends Error`, frekvenční `Map`, `toSorted`).

## Jak drilovat

1. Otevři `drill.ts` (prázdný), napiš řešení z hlavy.
2. `npx jest lessons/D2-generics-utility-errors/drills/0N` — dokud nic neexportuješ,
   spadne to na `is not a module` / `has no exported member`. To je v pořádku.
3. Po všech šesti smaž a jeď znovu. Cíl: každý do 3–4 minut, třetí kolo naslepo.

| # | Drill | Sval |
|---|---|---|
| 01 | generic-fn | `<T>`, `<T extends { id: string }>`, generická třída, getter |
| 02 | keyof | `K extends keyof T`, `T[K]`, komparátor, `toSorted` |
| 03 | utility-dto | `Omit`, `Partial`, `Pick`, filtr `undefined` v patchi, mělká kopie |
| 04 | custom-error | `extends Error`, `name`, `{ cause }`, `unknown` v catch |
| 05 | result | `Result<T, E>` union, `if (!r.ok) return r` |
| 06 | collections | frekvenční `Map`, top-K, `groupBy`, dedup přes `Set` |

## 6 tvarů, které chceš mít v prstech

```ts
// 1) Generika s constraintem a keyof
function sortBy<T, K extends keyof T>(xs: readonly T[], key: K): T[] {
  return xs.toSorted((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
}

// 2) DTO z jednoho typu
type CreateX = Omit<X, 'id' | 'createdAt'>;
type UpdateX = Partial<CreateX>;

// 3) Patch bez undefined
const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
const next = { ...current, ...clean };

// 4) Vlastní chyba + wrapping
class NotFoundError extends Error {
  constructor(public readonly id: string) { super(`${id} not found`); this.name = 'NotFoundError'; }
}
try { … } catch (e) { throw new Error('ctx', { cause: e }); }

// 5) Result
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

// 6) Frekvence + top-K
const m = new Map<string, number>();
for (const w of words) m.set(w, (m.get(w) ?? 0) + 1);
[...m].toSorted(([wa, a], [wb, b]) => b - a || wa.localeCompare(wb)).slice(0, k);
```

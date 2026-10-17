// DRILL 01 — generický stránkovací helper
//
// Napiš (z prázdné stránky):
//
//  1. export interface Page<T> { items: T[]; total: number; page: number; limit: number }
//  2. export function paginate<T>(items: T[], page: number, limit: number): Page<T>
//     - page je 1-based
//     - page < 1 nebo limit < 1 → throw new RangeError(...)
//     - stránka za koncem → items: [] (žádná chyba)
//     - vstupní pole nemutuj
//
// Sval: generická funkce, `slice` (ne `splice`!), tvar odpovědi {items,total,page,limit}
//
//   npx jest lessons/D6-testing-data/drills/01

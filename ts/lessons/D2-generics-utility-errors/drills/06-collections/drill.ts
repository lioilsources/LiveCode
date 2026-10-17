// DRILL 06 — Map, Set, sort, groupBy (vzory pro „rychlé" úlohy)
//
// Napiš a exportuj:
//
//  1. function wordFreq(text: string): Map<string, number>
//       lowercase, slova = sekvence [a-z0-9] (split podle /[^a-z0-9]+/), prázdná zahoď
//  2. function topK(freq: Map<string, number>, k: number): [string, number][]
//       podle počtu sestupně, při shodě abecedně vzestupně
//  3. function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]>
//       pořadí skupin = pořadí prvního výskytu
//  4. function uniqueBy<T>(items: readonly T[], keyFn: (item: T) => string): T[]
//       první výskyt vyhrává, pořadí zachovat
//
// Sval: `m.set(k, (m.get(k) ?? 0) + 1)`, `[...m].toSorted(...)`, `b - a || a.localeCompare(b)`, Set.
//
//   npx jest lessons/D2-generics-utility-errors/drills/06

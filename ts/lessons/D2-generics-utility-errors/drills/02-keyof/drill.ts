// DRILL 02 — keyof a T[K]
//
// Napiš a exportuj:
//
//  1. function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][]
//  2. function sortBy<T, K extends keyof T>(items: readonly T[], key: K, dir: 'asc' | 'desc' = 'asc'): T[]
//       NESMÍ mutovat vstup (toSorted nebo kopie); porovnávej přes < a >
//  3. function indexBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T>
//       při duplicitě vyhraje poslední
//
// Sval: `K extends keyof T`, `T[K]`, komparátor vracející -1/0/1, default parametr.
//
//   npx jest lessons/D2-generics-utility-errors/drills/02

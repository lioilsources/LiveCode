// DRILL 01 — generické funkce
//
// Napiš a exportuj:
//
//  1. function last<T>(xs: readonly T[]): T | undefined
//  2. function chunk<T>(xs: readonly T[], size: number): T[][]
//       chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
//       size < 1 → throw new RangeError('size must be >= 1')
//  3. function byId<T extends { id: string }>(items: readonly T[], id: string): T | undefined
//       (vrací celé T, ne jen {id})
//  4. class Stack<T> { push(x: T): void; pop(): T | undefined; peek(): T | undefined; get size(): number }
//
// Sval: `<T>`, `<T extends {...}>`, `readonly T[]`, generická třída, getter.
//
//   npx jest lessons/D2-generics-utility-errors/drills/01

// DRILL 03 — discriminated union + exhaustiveness (never)
//
// Napiš a exportuj:
//
//  1. type Shape = union tří variant s diskriminátorem `kind`:
//       { kind: 'circle'; r: number }
//       { kind: 'rect'; w: number; h: number }
//       { kind: 'triangle'; base: number; height: number }
//  2. function assertNever(x: never): never — hodí Error
//  3. function area(s: Shape): number — switch (s.kind), v default assertNever(s)
//  4. function totalArea(shapes: Shape[]): number — součet
//
// Sval: `| { kind: 'a'; ... }`, switch na diskriminátoru, `default: return assertNever(s)`.
// Zkus si pak přidat 4. variantu a podívej se, kde to spadne.
//
//   npx jest lessons/D1-ts-basics/drills/03

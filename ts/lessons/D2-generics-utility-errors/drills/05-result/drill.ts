// DRILL 05 — Result union (Go-style chyby jako hodnota)
//
// Napiš a exportuj:
//
//  1. type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }
//  2. function ok<T>(value: T): Result<T, never>   a   function err<E>(error: E): Result<never, E>
//  3. function parseAge(s: string): Result<number>
//       celé číslo 0..150 → ok; jinak err(`invalid age: ${s}`)    (pozor: '' není 0!)
//  4. function collect<T, E>(results: readonly Result<T, E>[]): Result<T[], E>
//       všechny ok → ok(hodnoty); jinak PRVNÍ chyba
//  5. function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T
//
// Sval: discriminated union na `ok`, zúžení `if (!r.ok) return r`, generika s defaultem.
//
//   npx jest lessons/D2-generics-utility-errors/drills/05

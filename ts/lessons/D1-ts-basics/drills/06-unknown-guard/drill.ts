// DRILL 06 — unknown + runtime validace (typy za běhu neexistují)
//
// Napiš a exportuj:
//
//  1. interface Signup { email: string; age: number; newsletter?: boolean }
//  2. function isSignup(x: unknown): x is Signup        ← type guard
//       objekt (ne null, ne pole), email string obsahující '@',
//       age celé číslo >= 18, newsletter chybí nebo boolean
//  3. function parseSignup(json: string): Signup
//       JSON.parse → isSignup → vrať; jinak throw new Error('invalid signup')
//       (i nevalidní JSON → 'invalid signup')
//       Vrať JEN známá pole (email, age, newsletter pokud byl) — nic navíc
//       (stejně jako ValidationPipe({ whitelist: true }))
//
// Sval: `x is T`, typeof/in narrowing nad unknown, try/catch.
//
//   npx jest lessons/D1-ts-basics/drills/06

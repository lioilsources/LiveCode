// DRILL 04 — vlastní chyby, unknown v catch, cause
//
// Napiš a exportuj:
//
//  1. class NotFoundError extends Error
//       constructor(entity: string, id: string) → message "<entity> <id> not found"
//       public readonly entity, id; name = 'NotFoundError'
//  2. class ValidationError extends Error
//       constructor(field: string, message: string); public readonly field; name = 'ValidationError'
//  3. function toHttpStatus(e: unknown): number
//       NotFoundError → 404, ValidationError → 400, jiný Error → 500, ne-Error → 500
//  4. function errorMessage(e: unknown): string
//       Error → e.message; string → ten string; cokoli jiného → 'unknown error'
//  5. function withContext<T>(what: string, fn: () => T): T
//       zavolá fn; když hodí, hodí new Error(`${what}: ${errorMessage(e)}`, { cause: e })
//
// Sval: `class X extends Error`, `super(msg, { cause })`, `this.name = ...`, `instanceof`.
//
//   npx jest lessons/D2-generics-utility-errors/drills/04

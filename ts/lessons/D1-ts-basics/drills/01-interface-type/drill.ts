// DRILL 01 — interface, type alias, literal union
//
// Napiš (z prázdné stránky, bez koukání jinam) a všechno EXPORTUJ:
//
//  1. type Role = union literálů 'admin' | 'editor' | 'viewer'
//  2. interface User { id: string; name: string; role: Role; email?: string }
//     (email je nepovinný)
//  3. function label(u: User): string
//       → "<name> (<role>)"            když email chybí
//       → "<name> (<role>) <email>"    když email je
//  4. function canEdit(u: User): boolean → true pro admin a editor
//
// Sval: `export interface X { a?: T }`, `export type R = 'a' | 'b'`, template string.
//
//   npx jest lessons/D1-ts-basics/drills/01

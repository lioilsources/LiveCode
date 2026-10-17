// DRILL 04 — ?? vs ||, optional chaining
//
// Napiš a exportuj:
//
//  1. interface ListQuery { page?: number; limit?: number; q?: string; sort?: 'asc' | 'desc' }
//  2. interface Normalized { page: number; limit: number; q: string; sort: 'asc' | 'desc' }
//  3. function normalize(query: ListQuery): Normalized
//       defaulty: page 1, limit 20, q '', sort 'asc'
//       ⚠️ 0 a '' jsou PLATNÉ hodnoty a musí projít (limit: 0 → 0, q: '' → '')
//       limit nad 100 ořízni na 100
//  4. interface Order { customer?: { address?: { city?: string } } }
//     function cityOf(o: Order | null | undefined): string → město, jinak 'unknown'
//
// Sval: `??`, `?.`, Math.min.
//
//   npx jest lessons/D1-ts-basics/drills/04

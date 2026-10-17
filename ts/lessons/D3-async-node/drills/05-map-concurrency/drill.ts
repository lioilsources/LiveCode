// DRILL 05 — mapWithConcurrency: worker pool v TS (≈ errgroup.SetLimit)
//
// Napiš:
//
//   export async function mapWithConcurrency<T, R>(
//     items: readonly T[],
//     limit: number,
//     fn: (item: T, index: number) => Promise<R>,
//   ): Promise<R[]>
//
//  - nikdy víc než `limit` souběžně běžících fn
//  - limit VYUŽIJ (ne dávky po `limit` — jakmile jeden doběhne, startuje další)
//  - výsledky v pořadí vstupu (zápis přes index, ne push)
//  - chyba ve fn → rejectne
//
// Sval: sdílený `let next = 0`, `async function worker() { while (next < n) { const i = next++; ... } }`,
//       `Promise.all(Array.from({ length: k }, () => worker()))`.
//
//   npx jest lessons/D3-async-node/drills/05

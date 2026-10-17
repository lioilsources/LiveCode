// DRILL 02 — sekvenčně vs. paralelně
//
// Napiš:
//
//   export async function fetchSequential(
//     ids: number[], fetchUser: (id: number) => Promise<string>,
//   ): Promise<string[]>
//     — jeden po druhém (await ve smyčce for…of), po chybě dál nevolá
//
//   export async function fetchParallel(
//     ids: number[], fetchUser: (id: number) => Promise<string>,
//   ): Promise<string[]>
//     — všechny naráz (Promise.all + map), výsledky v pořadí vstupu
//
// Sval: `for (const id of ids) out.push(await f(id))` vs `Promise.all(ids.map(f))`.
// Pozor: NE `ids.forEach(async ...)` — ten nečeká.
//
//   npx jest lessons/D3-async-node/drills/02

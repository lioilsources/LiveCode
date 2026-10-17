// DRILL 03 — Promise.allSettled: sesbírej úspěchy i chyby (≈ WaitGroup + slice chyb)
//
// Napiš:
//
//   export async function summarize(
//     tasks: Array<() => Promise<number>>,
//   ): Promise<{ ok: number[]; errors: string[] }>
//
//  - spusť všechny tasky SOUČASNĚ
//  - ok    = hodnoty fulfilled tasků v pořadí vstupu
//  - errors = zprávy rejected tasků v pořadí vstupu:
//             reason instanceof Error ? reason.message : String(reason)
//  - nikdy nerejectne
//
// Sval: `Promise.allSettled(...)` + narrowing přes `r.status === 'fulfilled'`.
//
//   npx jest lessons/D3-async-node/drills/03

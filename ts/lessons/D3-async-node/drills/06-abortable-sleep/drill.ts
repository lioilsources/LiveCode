// DRILL 06 — zrušitelný sleep (AbortSignal ≈ ctx.Done())
//
// Napiš:
//
//   export function sleep(ms: number, signal?: AbortSignal): Promise<void>
//
//  - bez signalu = obyčejný sleep
//  - signal už aborted → rejectni hned s `signal.reason`
//  - abort během čekání → clearTimeout + reject s `signal.reason`
//  - po normálním doběhnutí `removeEventListener('abort', …)` (stejná funkce, co jsi přidal)
//
// Sval: `signal?.addEventListener('abort', onAbort, { once: true })`,
//       `clearTimeout(timer)` a `removeEventListener` — úklid v obou větvích.
//
//   npx jest lessons/D3-async-node/drills/06

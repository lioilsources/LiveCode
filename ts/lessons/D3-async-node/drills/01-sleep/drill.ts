// DRILL 01 — sleep: Promise kolem callback API
//
// Napiš (z prázdné stránky, bez koukání jinam):
//
//   export function sleep(ms: number): Promise<void>
//
// Resolve po `ms` milisekundách (setTimeout). Žádné knihovny,
// žádné node:timers/promises — ručně přes `new Promise(...)`.
//
// Sval: `new Promise<void>((resolve) => ...)`
//
//   npx jest lessons/D3-async-node/drills/01

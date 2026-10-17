// DRILL 04 — withTimeout: Promise.race + clearTimeout ve finally
//
// Napiš:
//
//   export class TimeoutError extends Error
//     — constructor(ms: number), message "timeout after <ms>ms", name "TimeoutError"
//
//   export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T>
//     — vrátí hodnotu/chybu `p`, pokud doběhne do `ms`
//     — jinak rejectne TimeoutError
//     — VŽDY uklidí timer (test hlídá jest.getTimerCount() === 0)
//
// Sval: `let timer: NodeJS.Timeout | undefined`, `new Promise<never>(...)`,
//       `Promise.race([...]).finally(() => clearTimeout(timer))`.
//
//   npx jest lessons/D3-async-node/drills/04

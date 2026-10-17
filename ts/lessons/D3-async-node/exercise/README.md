# Exercise D3 — retry + batch processor s limitem a zrušením

**Časový limit: 30 minut** (realistická live-coding úloha: „zpracuj 10 000 položek
proti křehkému API, max 5 souběžně, s retry a zrušitelné").

Implementuj v `batch.ts` dvě funkce. Kostra se zkompiluje a hází `TODO`.

## 1) `retry(fn, opts)`

```ts
retry<T>(fn: (attempt: number) => Promise<T>, opts?: RetryOptions): Promise<T>
```

- Zavolej `fn(0)`; při chybě čekej a zkus `fn(1)`, … — celkem max `1 + retries` pokusů.
- Čekání před pokusem `n+1`: **full jitter** — `Math.random() * min(maxMs, baseMs * 2 ** n)`.
  Defaulty: `retries = 3`, `baseMs = 100`, `maxMs = 5000`.
- `shouldRetry(err)` (default: vždy `true`) — když vrátí `false`, chybu hned vyhoď.
- Po vyčerpání pokusů vyhoď **poslední** chybu.
- `signal`: před každým pokusem `throwIfAborted()`; čekání mezi pokusy musí jít
  přerušit (abort během backoffu → reject s `signal.reason` **hned**, ne po doběhnutí čekání).

## 2) `processBatch(items, worker, opts)`

```ts
processBatch<T, R>(
  items: readonly T[],
  worker: (item: T, signal: AbortSignal) => Promise<R>,
  opts: BatchOptions,
): Promise<BatchResult<T, R>>
```

- Max `opts.concurrency` souběžně běžících `worker` volání.
- Každá položka jde přes `retry` (`opts.retries`, `opts.baseMs`).
- **Selhání jedné položky nezastaví ostatní** — sesbírej je:
  `{ ok: [{ item, value }], failed: [{ item, error }] }`, obojí **v pořadí vstupu**.
- `worker` dostane `AbortSignal` (propagace dolů — jako `ctx` v Go).
- `opts.signal` aborted → nespouštěj žádné další položky a `processBatch` **rejectne**
  s `signal.reason`. (Rozběhnuté workery dostanou abort přes svůj signal.)

## Co interviewer sleduje

- Respektuješ limit souběžnosti — ne `Promise.all(items.map(...))`.
- `return await` uvnitř `try` v retry.
- Čekání v backoffu je zrušitelné a uklízí timer + listener.
- Rozlišíš „položka selhala" (sesbírat) vs. „celé zrušeno" (rejectnout).
- Umíš říct, proč retry patří jen na idempotentní operace.

```bash
npx jest lessons/D3-async-node/exercise
```

# Task 02 — Promise pool (`mapWithConcurrency`)

**Časový limit: 15 minut** · čisté TS/Node · vzor: worker pool bez goroutin

Klasika na Node pohovoru: „máme 10 000 URL, stáhni je, ale max 5 naráz".
`Promise.all(items.map(fn))` spustí **všech 10 000 hned** — to je přesně ta
odpověď, kterou interviewer chce slyšet, že nedáš.

## Zadání

```ts
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]>
```

- Nejvýš `limit` volání `fn` běží zároveň (a limit se má opravdu využít).
- Výsledek ve **stejném pořadí** jako `items`, bez ohledu na pořadí dokončení.
- Při první chybě: promise rejectne s tou chybou a **nespustí** žádnou další položku.
- `limit` musí být kladné celé číslo, jinak reject s `RangeError`.
- Prázdný vstup → `[]`.

```bash
npx jest tasks/02-promise-pool/task
npx jest tasks/02-promise-pool/solution
```

## Co interviewer sleduje

- Víš, proč `Promise.all(map)` nestačí a že Promise **startuje při vytvoření**
  (ne při `await`) — limit musí řídit, *kdy* `fn` zavoláš.
- Sdílený čítač bez zámku a umíš říct proč (jedno vlákno, mezi `await`
  nikdo jiný neběží) — v Go bys potřeboval channel nebo mutex.
- Víš, že běžící promise nejde zrušit — „nespouštět další" je maximum; pro
  skutečné zrušení by `fn` musel brát `AbortSignal`.
- Bonus: zmínka o `p-limit`, a jak by vypadalo `allSettled` chování.

<details>
<summary>Hint 1 — tvar</summary>

Spusť `min(limit, items.length)` „workerů". Každý worker je `async` smyčka:
vezmi `i = next++`, `results[i] = await fn(items[i], i)`, opakuj. Na konci
`await Promise.all(workers)`.
</details>

<details>
<summary>Hint 2 — chyba</summary>

`Promise.all` rejectne při první chybě workera samo. Aby ostatní workery
nebraly další položky, nastav sdílený flag `failed` a kontroluj ho ve `while`.
Pozor: s `noUncheckedIndexedAccess` je `items[i]` typu `T | undefined`.
</details>

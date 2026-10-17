# Task 03 — Retry s exponential backoff + jitter + AbortSignal

**Časový limit: 15 minut** · čisté TS/Node · vzor: Go `Retry(ctx, attempts, fn)` přeložené do TS

Totéž jako Go úloha 8, jen `context.Context` je tady `AbortSignal` a
`select { case <-time.After(d): case <-ctx.Done(): }` si musíš postavit sám.

## Zadání

```ts
export function backoffDelay(n: number, base: number, max: number, random: () => number): number
export async function retry<T>(
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions, // { retries, baseDelayMs, maxDelayMs, signal?, shouldRetry?, random? }
): Promise<T>
```

- `backoffDelay`: **full jitter** — `floor(random() * min(max, base * 2^n))`.
- `retry`: zavolá `fn(attempt, signal)` (attempt od 1). Při chybě počká
  `backoffDelay(attempt - 1, …)` a zkusí znovu, celkem max `retries + 1` pokusů.
- Po vyčerpání pokusů rejectne s **poslední** chybou.
- `shouldRetry(err, attempt)` vrátí `false` → okamžitě rejectne s tou chybou.
- `signal` už zrušený → `fn` se vůbec nezavolá, reject se `signal.reason`.
- Zrušení **během čekání** → reject hned (ne až po doběhnutí timeoutu), timer uklidit.
- Zrušení během běhu `fn` vyhrává nad chybou `fn`.

```bash
npx jest tasks/03-retry-backoff/task
npx jest tasks/03-retry-backoff/solution
```

## Co interviewer sleduje

- Proč jitter (thundering herd — všichni klienti se vrátí ve stejnou ms).
- Ne všechno se má opakovat: 4xx / validační chyby ne, 5xx / timeout / ECONNRESET ano;
  a opakovat jde bezpečně jen **idempotentní** operace (most k idempotency keys, úloha 05).
- Cancellable sleep: `setTimeout` + `addEventListener('abort')` + uklizení obou stran.
- `signal.throwIfAborted()`, `signal.reason`, `AbortSignal.timeout(ms)` pro deadline.
- `catch (err)` je `unknown` — nepředpokládáš, že je to `Error`.

<details>
<summary>Hint 1 — cancellable sleep</summary>

```ts
new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason);
  const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
  const onAbort = () => { clearTimeout(timer); reject(signal!.reason); };
  signal?.addEventListener('abort', onAbort, { once: true });
});
```
</details>

<details>
<summary>Hint 2 — smyčka</summary>

`for (let attempt = 1; ; attempt++) { try { return await fn(...) } catch (err) { … } }`
— `return await` uvnitř `try`, jinak `catch` rejection nechytí.
</details>

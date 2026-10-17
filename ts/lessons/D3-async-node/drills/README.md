# Drills — async do prstů

> Nejsou na pochopení, ale na **psaní**. Každý `drill.ts` je prázdný (jen zadání
> v komentáři), píše se z prázdné stránky a má test. Cíl: napsat `new Promise`,
> `Promise.all`, pool a zrušitelný sleep **bez přemýšlení nad syntaxí**.

## Jak drilovat

1. Otevři `drill.ts` — je prázdný. Napiš řešení **bez koukání** do LESSON.md.
2. `npx jest lessons/D3-async-node/drills/0N` — dokud tam není `export`, hlásí
   ts-jest `File '…drill.ts' is not a module` / `has no exported member`. To je záměr.
3. Zelená → další drill.
4. Po všech šesti **smaž obsah a jeď znovu**. Cíl: každý do 3 minut, třetí kolo naslepo.

```bash
npx jest lessons/D3-async-node/drills/05        # jeden
npx jest lessons/D3-async-node/drills           # všechny
```

| # | Drill | Sval | Go obdoba |
|---|---|---|---|
| 01 | `sleep(ms)` | `new Promise<void>((resolve) => setTimeout(resolve, ms))` | `time.Sleep` |
| 02 | `fetchSequential` / `fetchParallel` | `for…of` + `await` vs `Promise.all(map)` | smyčka vs goroutiny + WaitGroup |
| 03 | `summarize` přes `allSettled` | `r.status === 'fulfilled'` narrowing, `unknown` reason | WaitGroup + slice chyb |
| 04 | `withTimeout` + `TimeoutError` | `Promise.race`, `new Promise<never>`, `finally(clearTimeout)` | `select` + `time.After` (bez leaku) |
| 05 | `mapWithConcurrency` | sdílený index, K workerů, `results[i] =` | `errgroup.SetLimit` / worker pool |
| 06 | `sleep(ms, signal)` | `addEventListener('abort', …, { once: true })`, úklid v obou větvích | `select { case <-time.After: case <-ctx.Done(): }` |

## 6 tvarů, které chceš mít v prstech

Přečti jednou, zavři, piš.

```ts
// 1) Promise kolem callbacku
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 2) sekvenčně vs paralelně
for (const id of ids) out.push(await get(id));
const all = await Promise.all(ids.map((id) => get(id)));

// 3) allSettled
for (const r of await Promise.allSettled(ps)) {
  if (r.status === 'fulfilled') ok.push(r.value);
  else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
}

// 4) timeout bez leaku
let timer: NodeJS.Timeout | undefined;
const t = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new TimeoutError(ms)), ms); });
return Promise.race([p, t]).finally(() => clearTimeout(timer));

// 5) pool
let next = 0;
const worker = async () => { while (next < items.length) { const i = next++; res[i] = await fn(items[i]!, i); } };
await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

// 6) zrušitelné čekání
if (signal?.aborted) return reject(signal.reason);
const onAbort = () => { clearTimeout(timer); reject(signal!.reason); };
signal?.addEventListener('abort', onAbort, { once: true });
// …a v timeoutu: signal?.removeEventListener('abort', onAbort); resolve();
```

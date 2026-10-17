# Task 06 — Generická LRU cache s TTL + singleflight

**Časový limit: 15 minut** (+5 na `getOrLoad`) · čisté TS · vzor: `Map` jako uspořádaný slovník

Go verze (úloha 6) potřebovala `RWMutex` a goroutinu na expiraci. V TS
žádný mutex nepotřebuješ (jedno vlákno) a expiraci uděláš líně při čtení.

## Zadání

```ts
class LruCache<K, V> {
  constructor(opts: { capacity: number; ttlMs: number; now?: () => number })
  get size(): number
  get(key: K): V | undefined   // obnoví „recency", expirovaný → undefined (a smaž)
  has(key: K): boolean
  set(key: K, value: V): void  // nastaví TTL od teď; plno → vyhoď nejdéle nepoužitý
  delete(key: K): boolean
  getOrLoad(key: K, loader: () => Promise<V>): Promise<V>
}
```

- `capacity < 1` → `RangeError`.
- `get` **neprodlužuje** TTL, `set` ano. Uložit jde i `0` / `''` / `false`.
- `getOrLoad`: hit → hodnota; miss → `loader()`, výsledek uložit. **Souběžné
  missy na stejný klíč sdílí jeden běžící loader** (singleflight). Chyba loaderu
  se necachuje a dostanou ji všichni čekající.
- Čas jen přes `now` (default `Date.now`).

```bash
npx jest tasks/06-lru-ttl-cache/task
npx jest tasks/06-lru-ttl-cache/solution
```

## Co interviewer sleduje

- Víš, že `Map` iteruje v **pořadí vložení** → `delete` + `set` = „touch",
  `map.keys().next().value` = nejstarší. O(1) bez spojového seznamu.
- `get` vrací `V | undefined` — a proto `if (!value)` je bug pro `0`.
- Singleflight = mapa klíč → **Promise** (ne hodnota); `finally` ji uklidí
  i při chybě. Cache stampede / thundering herd po expiraci.
- Proč tu není potřeba zámek a kdy by byl (worker_threads, víc instancí → Redis).
- Produkce: `lru-cache` balíček, Redis, a že in-process cache se mezi
  instancemi rozchází (invalidace).

<details>
<summary>Hint 1 — eviction</summary>

```ts
while (this.entries.size > capacity) {
  this.entries.delete(this.entries.keys().next().value as K);
}
```
</details>

<details>
<summary>Hint 2 — singleflight</summary>

Než zavoláš loader, podívej se do `inflight: Map<K, Promise<V>>`. Pokud tam
promise je, vrať ji. Jinak vytvoř `async` IIFE s `try { … set … } finally { inflight.delete(key) }`
a ulož ji do `inflight` **synchronně** (před prvním `await`).
</details>

# Lekce D3 — Async & Node runtime

> V Go máš goroutiny, channely a `context`. V Node **nic z toho není** — je tam
> jedno vlákno, fronta úloh a `Promise`. Většina async chyb na pohovoru vzniká
> tím, že člověk z Go myslí v goroutinách: „tohle poběží paralelně", „tohle se
> zruší". Neběží a nezruší se. Tahle lekce dává pravidla.

## 1. Model běhu — „jeden číšník, hodně stolů"

| | Go | Node.js |
|---|---|---|
| Vlákna kódu | M:N scheduler, goroutiny běží **paralelně** na všech jádrech | **1 vlákno** pro tvůj JS kód |
| Čekání na I/O | goroutina se uspí, scheduler pustí jinou | callback / Promise se zařadí do fronty, vlákno jde dál |
| Kdo dělá I/O | runtime + netpoller | **libuv**: síť přes epoll/kqueue, soubory/DNS/crypto přes **thread pool** (4 vlákna) |
| Preempce | ano (od Go 1.14 i v tight loopu) | **ne** — dokud tvoje funkce nevrátí, nic jiného neběží |
| CPU práce | rozloží se na jádra | **zablokuje celý server** |

**Analogie:** Node je **jeden číšník v restauraci**. Vezme objednávku (request),
předá ji do kuchyně (I/O → libuv) a jde k dalšímu stolu. Když je jídlo hotové,
kuchyně zazvoní (callback do fronty) a číšník ho donese, **až bude mít volné ruce**.
Funguje to skvěle, dokud číšník sám nezačne u jednoho stolu loupat brambory
(CPU-bound práce) — pak čeká celá restaurace.

Go je restaurace s **padesáti číšníky**, kteří se střídají u stolů.

> Věta na pohovor: **„Node je single-threaded pro JavaScript, ale I/O je
> neblokující — paralelismus dělá libuv a OS, ne můj kód. Proto Node škáluje na
> I/O-bound zátěži a trpí na CPU-bound."**

### Dart?

Pokud znáš Dart/Flutter: **je to stejný model.** Jeden isolate = jedno vlákno
s event loopem, `Future` ≈ `Promise`, microtask queue i event queue existují
taky. `Isolate` ≈ `worker_threads`. Tady máš výhodu.

## 2. Event loop — call stack, microtasky, macrotasky

Tři místa, kde „čeká" kód:

1. **Call stack** — co se právě vykonává (synchronně, do konce).
2. **Microtask queue** — `Promise.then/catch/finally`, pokračování po `await`,
   `queueMicrotask()`. V Node ještě přednostnější **`process.nextTick`** queue.
3. **Macrotask (task) queue** — `setTimeout`, `setInterval`, `setImmediate`, I/O callbacky.

Pravidlo:

> **Po každém macrotasku (a po doběhnutí synchronního kódu) se vyprázdní
> CELÁ microtask queue — včetně microtasků, které vzniknou během vyprazdňování.
> Teprve pak přijde na řadu další timer / I/O.**

Pořadí priority v Node: **sync kód → `nextTick` → Promise microtasky → (další
fáze loopu) timery / I/O / `setImmediate`**. Fáze event loopu jdou v kruhu:
timers → poll (I/O) → check (`setImmediate`) → timers → …

### „Co to vypíše?" — klasika z pohovoru

Kód běží uvnitř callbacku (např. request handleru) — tam je pořadí deterministické:

```ts
setTimeout(() => {                      // jsme v macrotasku (jako v handleru)
  console.log('1 sync');
  setTimeout(() => console.log('2 timeout'), 0);
  setImmediate(() => console.log('3 immediate'));
  Promise.resolve().then(() => console.log('4 promise'));
  queueMicrotask(() => console.log('5 microtask'));
  process.nextTick(() => console.log('6 nextTick'));
  (async () => {
    console.log('7 async start');       // tělo async fn běží SYNCHRONNĚ až po první await
    await null;
    console.log('8 after await');       // tohle je microtask
  })();
  console.log('9 sync end');
}, 0);
```

Výstup:

```
1 sync
7 async start
9 sync end
6 nextTick
4 promise
5 microtask
8 after await
3 immediate
2 timeout
```

Jak to číst:
- `7` je synchronně — **async funkce běží synchronně až do prvního `await`**. To
  je častý chyták.
- `nextTick` předběhne Promise microtasky.
- `4`, `5`, `8` jsou microtasky v pořadí, jak byly zařazeny.
- `3` před `2`: z timer callbacku je další na řadě fáze **check** (`setImmediate`),
  timery až v příštím kole.

**Dvě nuance na top-levelu modulu** (řekni je — ukazuje to, že víš, ne že hádáš):
- `setTimeout(0)` vs `setImmediate` **není garantováno** — záleží, jak rychle loop nastartuje.
- V **ES modulu** (a pod `tsx`) se tělo modulu vykonává uvnitř Promise jobu, takže
  Promise microtasky proběhnou **před** `nextTick`. V CommonJS je `nextTick` první.
  (Ověřeno v `examples/01-event-loop-order.ts`.)

> **Microtask starvation:** rekurzivní `Promise.resolve().then(loop)` nebo
> `process.nextTick(loop)` nikdy nepustí event loop dál → timery ani I/O nedojdou
> ke slovu. Je to obdoba busy loopu.

## 3. Promise — „lístek z šatny"

Promise je **objekt reprezentující budoucí výsledek**. Tři stavy:

| Stav | Význam |
|---|---|
| `pending` | ještě se čeká |
| `fulfilled` | hotovo s hodnotou |
| `rejected` | hotovo s chybou |

Jakmile je `fulfilled`/`rejected` („settled"), **už se nezmění**.

**Analogie:** lístek z šatny. Dostaneš ho hned, kabát (hodnotu) si vyzvedneš později.

### Promise je EAGER ⚠️

```ts
const p = fetch('https://api.example.com/x');  // request UŽ LETÍ
// ... nic dalšího
await p;                                        // tady jen čekáš na výsledek
```

Vytvořením Promise se práce **spustí** — `await` ji nespouští, jen na ni čeká.
V Go je to jako `go f()` s výsledkem do channelu: start nastane v okamžiku
zavolání, ne čtení z channelu.

Důsledky:
- `const ps = urls.map(u => fetch(u))` → **všechny requesty letí naráz**. Na 10 000 URL
  to je 10 000 souběžných spojení. (Viz sekce 7.)
- Pokud chceš práci odložit, drž **funkci** `() => fetch(u)`, ne Promise. Tomu se
  říká *thunk* / *task factory*. Všechny pooly, retry apod. berou funkci.

### `async` / `await`

```ts
async function getUser(id: string): Promise<User> {
  const res = await fetch(`/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as User;
}
```

Pravidla:
- `async` funkce **vždy vrací Promise**. `return 5` → `Promise<number>`; `throw` → rejected Promise.
- `await x` „rozbalí" Promise; na ne-Promise hodnotě jen odloží pokračování do microtasku.
- `await` funguje jen v `async` funkci (nebo top-level v ES modulech).

### Promise ručně — wrapping callback API

```ts
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

Tohle je tvar, který chceš mít v prstech — drill 01.

## 4. Chyby v async kódu

### try/catch funguje s await

```ts
try {
  await doThing();
} catch (e: unknown) {          // e je unknown — mohlo být vyhozeno cokoli
  if (e instanceof HttpError) ...
  throw e;
}
```

### Zapomenutý `await` — floating promise 🧨

```ts
async function save() {
  try {
    db.insert(row);              // 🧨 bez await
  } catch (e) {
    log(e);                      // nikdy se nezavolá — chyba přijde až později
  }
}
```

Bez `await` try/catch **nezachytí** asynchronní chybu, funkce vrátí dřív, než
insert doběhne, a chyba skončí jako **unhandled rejection**. ESLint pravidlo
`@typescript-eslint/no-floating-promises` tohle chytá — zmiň to.

### Unhandled rejection = pád procesu

Od Node 15 je výchozí `--unhandled-rejections=throw`: rejected Promise, na který
nikdo nečeká (`await`/`.catch`), **shodí proces**. Obdoba neošetřeného `panic`
v goroutině — taky shodí celý program.

```ts
process.on('unhandledRejection', (reason) => { log(reason); process.exit(1); });
```

Pozor na past: **rejected Promise, na který začneš čekat až „později"**:

```ts
const a = failSoon();     // rejectne za 10 ms
await sleep(100);         // ... mezitím Node ohlásí unhandled rejection
await a;                  // pozdě
```

Proto se paralelní práce skládá přes `Promise.all`, ne přes postupné `await`.

## 5. Kombinátory — tabulka, kterou chceš umět naslepo

| | Čeká na | Výsledek | Při chybě | Go obdoba |
|---|---|---|---|---|
| `Promise.all(ps)` | všechny fulfilled **nebo první reject** | pole hodnot ve **stejném pořadí** | reject první chybou (fail-fast) | `errgroup.Wait()` |
| `Promise.allSettled(ps)` | všechny settled | `{status, value}` / `{status, reason}` | nikdy nerejectne | `WaitGroup` + slice chyb |
| `Promise.race(ps)` | **první settled** (i reject) | jeho hodnota/chyba | první chyba vyhrává | `select` na víc channelů |
| `Promise.any(ps)` | **první fulfilled** | jeho hodnota | `AggregateError`, až selžou všechny | „první úspěšný" hedged request |

### Kritická nuance: `Promise.all` NIC NERUŠÍ ⚠️

`errgroup.WithContext` při první chybě **zruší context** a ostatní goroutiny
(pokud ho respektují) skončí. `Promise.all` jen **přestane čekat** — ostatní
Promises **běží dál** (requesty letí, zápisy se dějí) a jejich výsledky se zahodí.

Chceš-li errgroup sémantiku, musíš to udělat ručně:

```ts
async function allOrAbort<T>(tasks: ((s: AbortSignal) => Promise<T>)[]): Promise<T[]> {
  const ac = new AbortController();
  try {
    return await Promise.all(tasks.map((t) => t(ac.signal)));
  } catch (e) {
    ac.abort(e);          // ≈ cancel() v errgroup.WithContext
    throw e;
  }
}
```

> Věta na pohovor: **„Promise.all je fail-fast, ale ne cancel-fast. Zbytek práce
> běží dál, dokud mu nepředám AbortSignal a neabortnu ho."**

### Sekvenčně vs. paralelně

```ts
// 🐢 sekvenčně — 3 × 100 ms = 300 ms
for (const id of ids) {
  results.push(await getUser(id));
}

// 🚀 paralelně — ~100 ms
const results = await Promise.all(ids.map((id) => getUser(id)));
```

`await` ve smyčce není chyba sám o sobě — je správně, když **na sobě kroky
závisejí** nebo když chceš záměrně omezit zátěž. Chyba je, když je to nechtěné.
Pozor: **`forEach` s async callbackem nečeká vůbec** — `ids.forEach(async id => await x(id))`
vrátí okamžitě a chyby jsou floating. Používej `for…of` nebo `Promise.all(map)`.

## 6. Timeout — `Promise.race` a leak timeru

```ts
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}
```

Dvě věci, na které interviewer kouká:
1. **`clearTimeout` ve `finally`.** Bez něj timer visí dál, drží event loop
   naživu (proces neskončí, Jest hlásí „open handles") a ve smyčce se kupí.
   Přesná obdoba Go pasti `time.After` ve smyčce.
2. **Timeout nezruší práci.** `p` běží dál — jen na něj přestaneš čekat. Pro
   skutečné zrušení potřebuješ `AbortSignal` (další sekce).

## 7. Concurrency limit — worker pool v TS

`Promise.all(items.map(fn))` spustí **všechno najednou**. Na pohovoru: „máme 10 000
ID, API snese 5 souběžných requestů" → potřebuješ pool. Tohle je **TS verze
`errgroup.SetLimit(5)`** a je to nejčastější async live-coding úloha.

```ts
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;                                  // sdílený index — bezpečné, je to 1 vlákno!

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;                          // „vezmi si job" — atomické, protože mezi
      results[i] = await fn(items[i]!, i);       // čtením a ++ není žádný await
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
```

Proč to funguje (a proč by v Go nefungovalo):
- V Go by `next++` z víc goroutin byl **data race** → mutex/atomic/channel.
  V Node mezi `const i = next++` a dalším řádkem **nemůže nic jiného běžet**,
  protože tam není `await`. **Race conditions v Node vznikají jen na `await` hranicích.**
- Pořadí výsledků zachovává zápis přes index (`results[i]`), ne `push`.
- `K` workerů = `K` goroutin čtoucích z `jobs` channelu. Stejný tvar.

> Věta na pohovor: **„V Node nemám data races na úrovni instrukcí, ale mám
> logické race conditions mezi awaity — check-then-act přes await není atomický."**

Typický příklad takového race: `if (!cache.has(k)) { const v = await load(k); cache.set(k, v); }`
— dva souběžné requesty oba načtou. Řešení: do cache ukládat **Promise**, ne hodnotu
(obdoba `singleflight`).

V produkci se používá `p-limit` nebo `p-map`; na pohovoru napiš ručně.

## 8. AbortController / AbortSignal — `context.Context` z Node

| Go | Node |
|---|---|
| `ctx, cancel := context.WithCancel(parent)` | `const ac = new AbortController(); ac.signal` |
| `cancel()` | `ac.abort(reason?)` |
| `ctx.Done()` | `signal.aborted` / `signal.addEventListener('abort', …)` |
| `ctx.Err()` | `signal.reason` (default `DOMException` jménem `AbortError`) |
| `context.WithTimeout(ctx, d)` | `AbortSignal.timeout(ms)` (reason `TimeoutError`) |
| strom contextů (child zruší rodič) | `AbortSignal.any([parent, AbortSignal.timeout(ms)])` |
| `if err := ctx.Err(); err != nil { return err }` | `signal.throwIfAborted()` |
| `http.NewRequestWithContext(ctx, …)` | `fetch(url, { signal })` |

Rozdíl, který musíš říct: **`AbortSignal` je jen notifikace.** Stejně jako
v Go `context` nic nezabije — zrušení funguje jen tam, kde ho kód **sám
kontroluje a propaguje dolů**. Funkce, která signal nepřijme, se zrušit nedá.

### Konvence

- Signal se předává jako **poslední parametr / v options**: `fn(arg, { signal })`.
  (V Go je ctx první parametr; v Node je `{ signal }` v options objektu.)
- Na začátku a mezi kroky: `signal?.throwIfAborted()`.
- U čekání: poslouchej `'abort'` a **odregistruj listener**, až skončíš (jinak leak
  + varování `MaxListenersExceededWarning`).

### Zrušitelný sleep — vzor, který chceš umět naslepo

```ts
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
```

(Node má i vestavěný `import { setTimeout as sleep } from 'node:timers/promises'`,
který bere `{ signal }`. Na pohovoru ho zmiň, ale umět napsat ručně je bod navíc.)

### Propagace dolů

```ts
async function handler(req: Request) {
  const signal = AbortSignal.any([req.signal, AbortSignal.timeout(2000)]);
  const user = await fetch(`${USERS}/${id}`, { signal });     // zruší se s requestem
  const orders = await loadOrders(id, { signal });            // předávám dál
}
```

## 9. Retry s exponential backoff + jitter

Stejné jako v Go: `delay = base * 2^attempt`, k tomu náhodný jitter (aby se
klienti nesynchronizovali — „thundering herd"), maximum, a **respektuj signal**.

```ts
async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  { retries = 3, baseMs = 100, maxMs = 5000, signal }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);                 // ⚠️ return AWAIT — jinak catch nechytí reject
    } catch (e) {
      if (attempt >= retries || signal?.aborted) throw e;
      const exp = Math.min(maxMs, baseMs * 2 ** attempt);
      await sleep(Math.random() * exp, signal); // "full jitter"
    }
  }
}
```

Na co se ptají:
- **`return await` uvnitř `try`** — bez `await` se vrátí rejected Promise a `catch`
  ho nezachytí. Jediné místo, kde `return await` *není* zbytečné.
- Retryuj jen **retryable** chyby (síť, 5xx, 429) — ne 400/404. Ideálně
  `shouldRetry(e)` callback.
- Retry na **neidempotentní** operaci (POST platby) bez idempotency key = dvojitá platba.

## 10. CPU-bound práce blokuje všechno

```ts
setInterval(() => console.log('tick', Date.now() - t0), 100);
// ... a pak:
const end = Date.now() + 500;
while (Date.now() < end) {}        // 500 ms busy loop
```

Během busy loopu **nepřijde žádný tick** — a stejně tak žádný HTTP request
na serveru. Jeden `JSON.parse` 100MB souboru, `bcrypt` synchronně, regex
s katastrofálním backtrackingem, nebo `sort` milionu prvků zastaví celou službu.

Řešení (stačí jmenovat):
- **`worker_threads`** — skutečná vlákna s vlastním isolate, komunikace přes zprávy
  (jako Dart Isolate). Pro CPU-heavy úlohy (hashing, image processing).
- Rozsekat práci a dávat event loopu prostor (`await setImmediate()` mezi dávkami).
- Přesunout mimo proces (fronta + worker služba).
- **Cluster / víc instancí** za load balancerem — Node se škáluje na jádra procesy, ne vlákny.

> Věta na pohovor: **„V Go bych na CPU práci pustil goroutiny; v Node ji z hlavního
> vlákna dostanu pryč — worker_threads, nebo jiná služba. Hlavní vlákno je jen pro
> orchestraci I/O."**

## 11. EventEmitter, streamy, `for await` — jen do hovoru

- **`EventEmitter`** — `on/once/emit`. Observer pattern, základ streamů, socketů,
  `process`. Listenery běží **synchronně** při `emit`. Neošetřený `'error'` event
  shodí proces.
- **Streamy** (`Readable`, `Writable`, `Transform`) — zpracování dat po kusech
  s **backpressure** (≈ buffered channel, který blokuje zapisovatele, když je plný).
  `pipeline(src, transform, dst)` z `node:stream/promises` správně propaguje
  chyby a uklízí — preferuj ho před `.pipe()`.
- **Async iterace** — `for await (const chunk of readable)`, async generátory
  `async function*`. Obdoba `for v := range ch`:

```ts
async function* paginate(url: string) {
  for (let page = 1; ; page++) {
    const res = await (await fetch(`${url}?page=${page}`)).json();
    yield* res.data;
    if (page >= res.total_pages) return;
  }
}
for await (const item of paginate('/api/matches')) { ... }
```

- `events.once(emitter, 'ready')` → Promise; `events.on(emitter, 'data')` → async iterator.

## 12. Shrnutí — pravidla do kapsy

1. 1 vlákno; paralelní je jen I/O. Žádná preempce → CPU práce blokuje vše.
2. Pořadí: sync → `nextTick` → Promise microtasky → pak fáze loopu (timery → I/O → `setImmediate`). Na top-levelu ESM a timeout-vs-immediate pozor.
3. Async funkce běží synchronně do prvního `await` a vždy vrací Promise.
4. Promise je eager. Chceš-li odložit start, drž funkci.
5. Každý Promise musí mít `await` nebo `.catch` — jinak unhandled rejection → pád.
6. `Promise.all` = fail-fast, **ne cancel**. `allSettled` = sesbírej vše.
7. `Promise.all(items.map(...))` = neomezená souběžnost. Limit = pool workerů.
8. Race conditions jen na hranicích `await`.
9. Timeout přes `race` + **`clearTimeout` ve `finally`**; skutečné zrušení = `AbortSignal`.
10. `AbortSignal` je `context` — předávej dolů, kontroluj `throwIfAborted()`, odregistruj listenery.
11. `return await` uvnitř `try`.

## Kontrolní otázky

1. Napíšeš `const results = await Promise.all(urls.map(u => fetch(u)))` a třetí
   fetch selže. Co se stane s ostatními requesty a co bys musel udělat, aby se
   chování podobalo `errgroup.WithContext`?
2. Proč v `mapWithConcurrency` nepotřebuješ mutex na sdílený index `next++`, ačkoli
   v Go bys ho potřeboval? A kde v Node race condition vzniknout **může**?
3. Co vypíše `setTimeout(() => log('A'), 0); Promise.resolve().then(() => log('B'));
   (async () => { log('C'); await null; log('D'); })(); log('E');` — a proč?
   (Odpověď: `C E B D A`.)

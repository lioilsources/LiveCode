# Live-coding úlohy na čas — TypeScript / Node / NestJS

Každá úloha: `README.md` (zadání, limit, co interviewer sleduje, hinty pod
`<details>`), kostra, testy a vzorové řešení v `solution/` (kopie testů,
vždy zelené). **`solution/` otevři až po vlastním pokusu**, i neúspěšném.

## Přehled

| # | Úloha | Limit | Co trénuje | Pravděpodobnost |
|---|---|---|---|---|
| 01 | [`01-todo-crud`](01-todo-crud/README.md) | 40 min | Nest od nuly: modul, controller, service, DTO + `ValidationPipe`, 201/204/400/404, e2e | 🔥🔥🔥 skoro jistě něco takového |
| 02 | [`02-promise-pool`](02-promise-pool/README.md) | 15 min | `mapWithConcurrency` — worker pool bez goroutin, pořadí výsledků, chyba | 🔥🔥🔥 klasická Node otázka |
| 03 | [`03-retry-backoff`](03-retry-backoff/README.md) | 15 min | exponential backoff + full jitter, `AbortSignal` jako `context`, fake timers | 🔥🔥 |
| 04 | [`04-rate-limit-guard`](04-rate-limit-guard/README.md) | 20 min | Nest guard, token bucket, `Retry-After`, čas jako DI závislost | 🔥🔥 |
| 05 | [`05-idempotency-interceptor`](05-idempotency-interceptor/README.md) | 25 min | interceptor + RxJS, Idempotency-Key, 409/422, race condition | 🔥🔥 (seniorní pozice) |
| 06 | [`06-lru-ttl-cache`](06-lru-ttl-cache/README.md) | 15 min | generická třída, `Map` jako LRU, TTL, singleflight | 🔥🔥 |
| 07 | [`07-paginated-aggregate`](07-paginated-aggregate/README.md) | 15 min | `fetch`, stránkování, `res.ok`, peníze v centech | 🔥🔥 (i HackerRank) |
| 08 | [`08-orders-service`](08-orders-service/README.md) | 35 min | service se závislostí, atomická rezervace, doménové chyby → exception filter, unit test s mockem | 🔥🔥🔥 |

Doporučené pořadí v týdnu: **01 → 02 → 08 → 07 → 03 → 06 → 04 → 05**.
Den před pohovorem: 01 a 02 znovu z prázdné stránky, nic nového.

```bash
cd ts
npx jest tasks/02-promise-pool/task           # tvoje řešení
npx jest tasks/02-promise-pool/solution       # referenční
npx jest tasks/01-todo-crud/tasks --watch     # průběžně při psaní
```

Pozn.: `npx jest tasks/01-todo-crud` by spustilo i `solution/` — proto filtr
na jméno test souboru (`…/task`, `…/tasks`, `…/orders`, …).

## Jak řešit (stejný rytmus jako na pohovoru)

1. **Stopky** na limit úlohy. Když vyprší, dopiš do `PROGRESS.md`, kde ses
   zasekl, a pak teprve `solution/`.
2. **Nahlas zopakuj zadání** a polož 2–3 doplňující otázky (co když je vstup
   prázdný? co vrací chyba? je to idempotentní?). Zapiš si edge cases jako
   komentáře — interviewer vidí, že na ně myslíš, i když na ně nezbude čas.
3. **Kostra** — typy/interfaces, signatury, prázdné metody. U Nestu: modul →
   controller → service → zapojit do `AppModule`. Spusť, ať to „žije".
4. **Happy path** — nejjednodušší funkční verze, pusť testy.
5. **Validace a chyby** — DTO, 400/404/409, hraniční případy.
6. **Testy / úklid** — u live codingu stačí říct, co bys testoval; tady
   je máš hotové, tak je pouštěj průběžně, ne až na konci.
7. Poslední 2–3 minuty: **co bys udělal v produkci** (DB, transakce,
   Redis, logování, metriky, horizontální škálování).

## Co interviewer na TS/Nest live codingu chce slyšet

- [ ] `strict` TS: žádné `any`; `unknown` v `catch` a u dat z venku, zúžené kontrolou.
- [ ] **Typy za běhu neexistují** → validace vstupu na hranici (DTO třída + `class-validator`),
      ne `as CreateDto`.
- [ ] Tenký controller, logika v service, DI přes konstruktor; závislosti
      (čas, náhoda, externí API) injektovatelné kvůli testům.
- [ ] Správné HTTP kódy: 201 create, 204 bez těla, 400 validace, 404, 409 konflikt stavu, 422, 429.
- [ ] Doménové chyby vs. `HttpException` — a kde se mapují (exception filter).
- [ ] Event loop: jedno vlákno, Promise startuje při vytvoření, `Promise.all` nemá limit
      ani nic neruší, CPU práce blokuje všechny requesty.
- [ ] Zrušení přes `AbortSignal` (= Go `context`), timeouty na každé odchozí volání
      (`fetch` žádný default nemá), `fetch` nehází na 4xx/5xx.
- [ ] Souběh i v jednom vlákně: mezi dvěma `await` se může stát cokoli
      (check-then-act přes `await` = race) — u DB transakce / atomický `UPDATE … WHERE`.
- [ ] Idempotence a retry: co je bezpečné opakovat, jitter, Idempotency-Key.
- [ ] Testy: unit s `Test.createTestingModule` + `useValue` mock, e2e přes `supertest`,
      `overrideProvider` pro hodiny/konfiguraci.
- [ ] Peníze ne jako float; ID jako UUID; čas jako ISO string v API.

# Task 04 — Rate limit guard (token bucket)

**Časový limit: 20 minut** · NestJS · vzor: guard + DI + injektovatelné hodiny

## Zadání

Doplň `RateLimitGuard` (`rate-limit.guard.ts`). Modul, controller, `Clock`
a options jsou připravené.

- Klíč klienta je hlavička `x-api-key`. Chybí → **401**.
- Každý klíč má vlastní **token bucket**: `capacity` tokenů (burst), doplňuje
  se rychlostí `refillPerSec` (spojitě — klidně půl tokenu), nikdy nad `capacity`.
  Nový klíč začíná s plným kbelíkem.
- Request spotřebuje 1 token. Když není celý token → **429** a hlavička
  `Retry-After` = za kolik **celých sekund (zaokrouhleno nahoru)** bude 1 token.
- Odmítnutý request token nespotřebuje.
- Čas ber **jen** z injektovaného `Clock` (test ho podvrhne přes `overrideProvider`).

```bash
npx jest tasks/04-rate-limit-guard/rate-limit
npx jest tasks/04-rate-limit-guard/solution
```

## Co interviewer sleduje

- Víš, kde v pipeline guard je (po middleware, před interceptory/pipes) a proč
  je to správné místo (rozhoduje „smí request dál?").
- `ExecutionContext.switchToHttp().getRequest()/getResponse()`.
- Líný refill (dopočet z času) místo `setInterval` na každý klíč.
- Testovatelnost: čas jako závislost (`abstract class Clock` jako DI token).
- Produkce: in-memory mapa nefunguje přes víc instancí → Redis
  (`INCR` + `EXPIRE` nebo Lua skript pro atomicitu), úklid neaktivních klíčů,
  `@nestjs/throttler` jako hotové řešení. Fixed window vs sliding window vs token bucket.

<details>
<summary>Hint 1 — výpočet</summary>

```
tokens = min(capacity, tokens + (now - updatedAt) / 1000 * refillPerSec)
retryAfter = ceil((1 - tokens) / refillPerSec)
```
</details>

<details>
<summary>Hint 2 — 429 s hlavičkou</summary>

`res.setHeader('Retry-After', n)` **před** `throw new HttpException('Too Many Requests',
HttpStatus.TOO_MANY_REQUESTS)` — default exception filter hlavičky ponechá.
</details>

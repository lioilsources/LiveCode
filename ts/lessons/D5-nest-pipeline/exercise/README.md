# D5 exercise — guard, `@Public`, `@CurrentUser`, envelope, doménový filter

**Časový limit: 30 minut** · typická „druhá půlka" live codingu: *„a teď
přidej autentizaci a jednotný formát odpovědí"*.

V `src/` je hotová malá appka (projekty patřící uživatelům). Controller
(`projects/projects.controller.ts`) a service **neměň** — dekorátory
`@Public()` a `@CurrentUser()` už jsou použité, jen nedělají nic.

```bash
npx jest lessons/D5-nest-pipeline/exercise/src
```

## Zadání

| Soubor | Co napsat |
|---|---|
| `auth/public.decorator.ts` | `Public()` přes metadata (třída i metoda) |
| `auth/api-key.guard.ts` | `ApiKeyGuard`: `@Public` → pusť; `x-api-key` → uživatel z `API_KEYS`, jinak **401**; ulož do `req.user` |
| `auth/current-user.decorator.ts` | `@CurrentUser()` → `req.user`, `@CurrentUser('id')` → jedno pole |
| `common/response-envelope.interceptor.ts` | úspěch → `{ data, meta: { durationMs } }`; chyby nechat být |
| `common/domain-error.filter.ts` | `NotFoundError` → 404, `AccessDeniedError` → 403, tvar `{ error: { code, message } }`; `HttpException` nechytat |
| `app.module.ts` | všechno tři zaregistruj **globálně přes DI** |

Test importuje **jen `AppModule`** — nic nenastavuje přes `app.useGlobal*`.

## Na co interviewer kouká

- Auth je **guard**, ne middleware (guard zná handler a jeho metadata).
- 401 (nevím, kdo jsi) vs 403 (nesmíš) — a že `return false` by dal 403.
- `getAllAndOverride(KEY, [ctx.getHandler(), ctx.getClass()])` — `@Public` funguje na metodě i třídě.
- `APP_GUARD` / `APP_INTERCEPTOR` / `APP_FILTER` místo `app.useGlobal*` (DI + testy).
- Service hází doménové chyby bez HTTP — mapování je na jednom místě.
- Proč chyby nemají envelope? (výjimka přeskočí `map` a jde do filtru)

Doplňující otázky, na které si připrav odpověď nahlas:

1. Jak bys přidal rate limit per API klíč? (guard + `Map<key, bucket>`, nebo `@nestjs/throttler`)
2. Kde bys logoval 5xx s request-id? (catch-all filter `@Catch()` + middleware na request-id)
3. Jak tohle otestovat bez HTTP? (`new ApiKeyGuard(new Reflector())` + mock `ExecutionContext`)

Vzorové řešení: `solution/src/` — **až po pokusu**:

```bash
npx jest lessons/D5-nest-pipeline/exercise/solution
```

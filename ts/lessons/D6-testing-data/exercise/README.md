# Exercise D6 — Users API se stránkováním, repozitářem a testy

**Časový cíl: 35 minut** (na pohovoru by tohle byla celá live coding úloha).

## Zadání

Doplň Nest modul `UsersModule`:

| Endpoint | Chování |
|---|---|
| `GET /users?page&limit&role` | stránkovaný seznam `{ items, total, page, limit }`; default `page=1`, `limit=10`; `limit ≤ 100`; `role ∈ admin\|member`; neznámý parametr → 400 |
| `GET /users/:id` | 200 / 404; `abc` → 400 |
| `POST /users` | `{ name, email, role }` → 201; email se uloží `trim().toLowerCase()`; obsazený email → **409**; nevalidní tělo / neznámé pole → 400 |

Architektura (to je to, co interviewer hodnotí):

```
UsersController ──► UsersService ──► UsersRepository (abstract class = DI token)
                                          ▲
                                InMemoryUsersRepository  (useClass v modulu)
```

- **Stránkování dělá repozitář** (`findPage({ role, offset, limit })` → `{ items, total }`),
  service jen přepočítá `page/limit → offset`. V DB to bude `LIMIT/OFFSET` + `COUNT(*)`,
  ne „načti všechno a `slice`".
- Doménové chyby (`NotFoundException`, `ConflictException`) háže **service**.
- Controller je tenký: dekorátory, pipes, delegace.

## Soubory

| Soubor | Stav |
|---|---|
| `user.ts` | dané — `User`, `Role`, `ROLES`, `Page<T>` |
| `setup-app.ts` | dané — globální `ValidationPipe` (sdílí main.ts i e2e) |
| `users.repository.ts` | kontrakt dán, **doplň `InMemoryUsersRepository`** |
| `dto/list-users.query.ts` | **doplň dekorátory** |
| `dto/create-user.dto.ts` | **doplň dekorátory** |
| `users.service.ts` | **doplň metody** |
| `users.controller.ts` | **napiš routy** |
| `users.module.ts` | **zaregistruj providery** |
| `users.service.spec.ts` | unit testy (mock repozitáře přes `useValue`) |
| `users.e2e-spec.ts` | e2e přes supertest |

## Spuštění

```bash
npx jest lessons/D6-testing-data/exercise/users.service   # nejdřív unit
npx jest lessons/D6-testing-data/exercise                 # pak všechno
```

Doporučené pořadí: service (unit testy zelené) → repozitář → DTO → controller →
modul (e2e zelené). Přesně tak bys to dělal i nahlas na pohovoru: *„začnu
doménou a unit testem, HTTP vrstvu přidám nakonec"*.

## Na co se interviewer zeptá

1. Proč je `UsersRepository` abstraktní třída a ne `interface`?
2. Co se stane s `?page=2` bez `@Type(() => Number)`? A bez `transform: true`?
3. Proč stránkování v repozitáři, a ne v service?
4. Jak bys vyměnil in-memory za Prisma, aniž bys sáhl na service a testy?
5. Proč 409 a ne 400 pro obsazený email? A co race condition dvou souběžných
   registrací se stejným emailem? (→ unique index v DB, chytit chybu porušení
   constraintu a převést na `ConflictException`.)

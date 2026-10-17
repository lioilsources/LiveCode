# Task 05 — Idempotency-Key interceptor

**Časový limit: 25 minut** · NestJS + RxJS · vzor: interceptor kolem handleru · most ke Go Q3

Klient pošle platbu, spojení spadne dřív, než dostane odpověď, a pošle ji
znovu. Bez idempotence zaplatí dvakrát. Řešení à la Stripe: klient posílá
hlavičku `Idempotency-Key`, server si první odpověď zapamatuje a opakování
ji jen přehraje.

## Zadání

Doplň `IdempotencyInterceptor` (`idempotency.interceptor.ts`). Controller,
`PaymentsService`, `IdempotencyStore` a `fingerprint(body)` jsou připravené.

| Situace | Výsledek |
|---|---|
| chybí `Idempotency-Key` | **400**, handler se nezavolá |
| nový klíč | handler proběhne, odpověď se uloží |
| stejný klíč + stejné tělo, hotovo | **stejná odpověď** (201, stejné `id`), hlavička `Idempotent-Replayed: true`, handler **ne** |
| stejný klíč + stejné tělo, první request ještě běží | **409** |
| stejný klíč + **jiné** tělo | **422** |
| handler skončil chybou | nic se neukládá, klíč jde použít znovu |

„Stejné tělo" = stejný `fingerprint(req.body)` (nezávislý na pořadí klíčů).

```bash
npx jest tasks/05-idempotency-interceptor/idempotency
npx jest tasks/05-idempotency-interceptor/solution
```

## Co interviewer sleduje

- Proč interceptor a ne middleware/guard: potřebuješ obalit **před i po**
  handleru a mít jeho výsledek → `next.handle().pipe(tap(...), catchError(...))`.
- Vrátit odpověď bez handleru: `return of(saved)` — `next.handle()` se nezavolá.
- Stav `in_progress` + race condition: v Node je `get` + `set` bez `await` mezi
  nimi atomické; s Redisem / více instancemi potřebuješ `SET key NX PX`, v SQL
  `UNIQUE(key)` + `INSERT … ON CONFLICT DO NOTHING`.
- Co se ukládá: tělo (a v produkci status + vybrané hlavičky), TTL (24 h),
  scope klíče per zákazník/tenant + endpoint.
- Proč se chyby necachují (nebo které ano — 4xx validace by šlo, 5xx nikdy).
- Vztah k at-least-once doručování a dedup na straně consumeru (stejný princip).

<details>
<summary>Hint 1 — kostra interceptoru</summary>

```ts
const req = context.switchToHttp().getRequest<{ body: unknown; header(n: string): string | undefined }>();
const res = context.switchToHttp().getResponse<{ setHeader(n: string, v: string): unknown }>();
```
</details>

<details>
<summary>Hint 2 — RxJS část</summary>

```ts
this.store.set(key, { state: 'in_progress', fingerprint: fp });
return next.handle().pipe(
  tap((body) => this.store.set(key, { state: 'done', fingerprint: fp, body })),
  catchError((err) => { this.store.delete(key); return throwError(() => err); }),
);
```
Status kód při replayi nemusíš nastavovat — Nest dá POST route default 201.
</details>

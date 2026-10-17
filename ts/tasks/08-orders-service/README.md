# Task 08 — Orders + Inventory (atomická rezervace, doménové chyby)

**Časový limit: 35 minut** · NestJS · vzor: service se závislostí, doménové chyby → HTTP, unit + e2e

Druhé nejpravděpodobnější zadání: „objednávka, která sahá na sklad". Testuje,
jestli oddělíš doménu od HTTP, jestli myslíš na atomicitu a jestli umíš
napsat unit test s mockem závislosti.

## Zadání

Připraveno (neměň): `InventoryService` (`available(sku)`, `adjust(sku, delta)`),
`GET /inventory/:sku`, doménové chyby v `errors.ts`, `app.module.ts`, `app.setup.ts`.

Napiš:

1. **`orders.dto.ts`** — `{ items: { sku: string; qty: number }[] }`: `items`
   neprázdné pole, `sku` neprázdný string, `qty` celé číslo ≥ 1; validovat
   i vnořené položky, neznámá pole → 400.
2. **`OrdersService`**
   - `create(dto)` — **všechno, nebo nic**: když na kteroukoli položku není dost,
     nerezervuj nic a vyhoď `InsufficientStockError` se **všemi** nedostatky
     (`{ sku, requested, available }`). Duplicitní SKU v jedné objednávce sečti.
     Neznámé SKU → `UnknownSkuError` (z `available()`).
   - `findOne(id)` → `OrderNotFoundError`.
   - `cancel(id)` — vrátí zásoby, status `cancelled`; **idempotentní**.
3. **`OrdersController`** — `POST /orders` (201), `GET /orders/:id`,
   `POST /orders/:id/cancel` (**200**).
4. **`DomainExceptionFilter`** — `OrderNotFoundError` → 404,
   `InsufficientStockError` → 409 + `shortages`, `UnknownSkuError` → 422.
   Tělo `{ statusCode, error: err.name, message, … }`.

```bash
npx jest tasks/08-orders-service/orders     # unit + e2e
npx jest tasks/08-orders-service/solution
```

## Co interviewer sleduje

- Service nehází `HttpException` — doménové chyby a mapování ve filtru
  (service je znovupoužitelná z fronty/CLI). Umíš obhájit i opak (jednodušší).
- Atomicita: „nejdřív zkontroluj vše, pak měň". Proč to v Node funguje bez
  zámku (žádný `await` mezi kontrolou a zápisem) a **co by se rozbilo s DB**
  → transakce, `SELECT … FOR UPDATE`, nebo `UPDATE … WHERE qty >= $1` + affected rows.
- `@ValidateNested({ each: true })` + `@Type(() => OrderItemDto)` — bez nich
  vnořené položky projdou nevalidované (tichý bug).
- Unit test service s `{ provide: InventoryService, useValue: mock }` —
  ověříš, že `adjust` se při nedostatku **nezavolal**.
- `@HttpCode(200)` na akční POST endpoint; idempotentní cancel.
- Produkce: rezervace s expirací, outbox event `OrderCreated`, saga při platbě.

<details>
<summary>Hint 1 — create</summary>

```ts
const wanted = new Map<string, number>();
for (const { sku, qty } of dto.items) wanted.set(sku, (wanted.get(sku) ?? 0) + qty);
const shortages = [...wanted].flatMap(([sku, requested]) => {
  const available = this.inventory.available(sku);
  return available < requested ? [{ sku, requested, available }] : [];
});
if (shortages.length) throw new InsufficientStockError(shortages);
for (const [sku, qty] of wanted) this.inventory.adjust(sku, -qty);
```
</details>

<details>
<summary>Hint 2 — filtr</summary>

`host.switchToHttp().getResponse()` → `res.status(code).json(body)`.
`@Catch(DomainError)` chytí všechny podtřídy; `instanceof` funguje díky
`class … extends Error` (target ES2015+). Filtr je registrovaný přes
`APP_FILTER` v modulu, takže platí i v testu.
</details>

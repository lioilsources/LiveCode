# Task 07 — Stránkované REST API + agregace (`fetch`)

**Časový limit: 15 minut** · Node 22 `fetch` · vzor: Go `hackerrank/tasks/07` v TS

## Zadání

API vrací objednávky stránkovaně:

```
GET {baseUrl}/api/orders?customer={customer}&page={page}
```

```json
{
  "page": 1, "per_page": 3, "total": 7, "total_pages": 3,
  "data": [ { "id": 1, "customer": "Acme Corp", "amount": "10.10", "status": "paid" } ]
}
```

```ts
export function toCents(amount: string): number
export async function totalPaidCents(baseUrl: string, customer: string): Promise<number>
```

- Projdi **všechny** stránky, sečti `amount` objednávek se `status === 'paid'`.
- Výsledek v **centech** (celé číslo). `amount` je string: `"10.10"`, `"5"`, `"1.5"`.
- Neexistující zákazník → `total_pages: 0` → vrať `0` po **jednom** requestu.
- Non-2xx odpověď → reject s chybou obsahující status. Síťová chyba → reject.
- Jméno zákazníka může obsahovat mezery a `&`.

```bash
npx jest tasks/07-paginated-aggregate/task
npx jest tasks/07-paginated-aggregate/solution
```

## Co interviewer sleduje

- **`fetch` nehází na 4xx/5xx** — `if (!res.ok) throw …`. Nejčastější chyba.
- `new URL()` + `searchParams.set()` místo lepení stringů (escaping).
- Peníze ne jako float: `0.1 + 0.2 !== 0.3` → centy (nebo decimal knihovna).
- Ukončení smyčky při `total_pages: 0` (`do … while (page <= totalPages)`).
- Timeout na request (`AbortSignal.timeout(ms)`) — fetch default žádný nemá.
- Bonus: po první stránce známe `total_pages` → zbytek paralelně, ale
  s limitem (úloha 02), ne `Promise.all` na 1000 stránek.

<details>
<summary>Hint — kostra smyčky</summary>

```ts
let page = 1, totalPages = 1, total = 0;
do {
  const url = new URL('/api/orders', baseUrl);
  url.searchParams.set('customer', customer);
  url.searchParams.set('page', String(page));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as Page<Order>;
  // …
  totalPages = body.total_pages;
  page++;
} while (page <= totalPages);
```
</details>

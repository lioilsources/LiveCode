export interface Order {
  id: number;
  customer: string;
  amount: string; // "12.50" — peníze jako string!
  status: 'paid' | 'pending' | 'refunded';
}

export interface Page<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: T[];
}

/** "12.50" → 1250. Float by sčítal 0.1 + 0.2 = 0.30000000000000004. */
export function toCents(amount: string): number {
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!m) throw new Error(`Invalid amount: ${JSON.stringify(amount)}`);
  const [, sign, whole, frac = ''] = m;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return sign === '-' ? -cents : cents;
}

async function fetchPage(baseUrl: string, customer: string, page: number): Promise<Page<Order>> {
  const url = new URL('/api/orders', baseUrl);
  url.searchParams.set('customer', customer); // escapuje mezery, & atd.
  url.searchParams.set('page', String(page));

  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) {
    // fetch NEhází na 4xx/5xx — jen na síťovou chybu. Status musíš kontrolovat sám.
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Page<Order>;
}

/** Součet `amount` všech `paid` objednávek zákazníka, v haléřích/centech. */
export async function totalPaidCents(baseUrl: string, customer: string): Promise<number> {
  let total = 0;
  let page = 1;
  let totalPages = 1;

  do {
    const body = await fetchPage(baseUrl, customer, page);
    for (const order of body.data) {
      if (order.status === 'paid') total += toCents(order.amount);
    }
    totalPages = body.total_pages; // 0 → smyčka skončí po první stránce
    page++;
  } while (page <= totalPages);

  return total;
}

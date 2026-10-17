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

/** "12.50" → 1250, "5" → 500, "1.5" → 150. Nevalidní → throw. */
export function toCents(amount: string): number {
  throw new Error('TODO');
}

/** Součet `amount` všech `paid` objednávek zákazníka, v centech. */
export async function totalPaidCents(baseUrl: string, customer: string): Promise<number> {
  throw new Error('TODO');
}

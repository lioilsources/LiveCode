/**
 * Zavolá `fn` pro každou položku, nejvýš `limit` volání běží souběžně.
 * Výsledky ve stejném pořadí jako `items`. Při první chybě rejectne
 * a už nespustí žádnou další položku.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  throw new Error('TODO');
}

/**
 * Zavolá `fn` pro každou položku, nejvýš `limit` volání běží souběžně.
 * Výsledky ve stejném pořadí jako `items`. Při první chybě rejectne
 * a už nespustí žádnou další položku (běžící dobíhají — Promise nejde zrušit).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }

  const results = new Array<R>(items.length);
  let next = 0; // sdílený index — bezpečné, JS je jednovláknový (žádný mutex)
  let failed = false;

  // Worker = smyčka, která si bere další index, dokud nějaký zbývá.
  // Stejný tvar jako Go worker pool, jen místo channelu sdílený čítač.
  async function worker(): Promise<void> {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i] as T, i);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

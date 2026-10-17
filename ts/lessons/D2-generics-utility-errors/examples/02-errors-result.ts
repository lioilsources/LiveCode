// Chyby: throw čehokoli, unknown v catch, custom Error + cause, Result union.
//   npx tsx lessons/D2-generics-utility-errors/examples/02-errors-result.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

class NotFoundError extends Error {
  constructor(
    public readonly entity: string,
    public readonly id: string,
    options?: { cause?: unknown },
  ) {
    super(`${entity} ${id} not found`, options);
    this.name = 'NotFoundError';
  }
}

const db = new Map([['o1', { id: 'o1', total: 100 }]]);

function getOrder(id: string) {
  const o = db.get(id);
  if (!o) throw new NotFoundError('order', id);
  return o;
}

// 1) unknown v catch → zúžit
function message(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return `non-error thrown: ${String(e)}`;
}

for (const thrower of [() => getOrder('o9'), () => { throw 'just a string'; }]) {
  try {
    thrower();
  } catch (e) {
    console.log(message(e));
  }
}

// 2) Wrapping přes cause (= Go %w) a hledání v řetězu (= errors.As)
function loadInvoice(orderId: string) {
  try {
    return { invoiceFor: getOrder(orderId).id };
  } catch (e) {
    throw new Error(`loading invoice for ${orderId} failed`, { cause: e });
  }
}

function findCause<T extends Error>(e: unknown, cls: new (...args: any[]) => T): T | undefined {
  for (let cur = e; cur instanceof Error; cur = cur.cause) {
    if (cur instanceof cls) return cur;
  }
  return undefined;
}

try {
  loadInvoice('o42');
} catch (e) {
  console.log('top:', message(e));
  const nf = findCause(e, NotFoundError);
  console.log('cause NotFoundError?', nf?.entity, nf?.id);
}

// 3) Result union — očekávané neúspěchy jako hodnota (Go styl)
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

function parsePort(s: string | undefined): Result<number> {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 && n < 65536 ? { ok: true, value: n } : { ok: false, error: `invalid port: ${s}` };
}

for (const raw of ['8080', 'abc', undefined, '70000']) {
  const r = parsePort(raw);
  console.log(raw, '→', r.ok ? `port ${r.value}` : r.error); // r.value existuje jen po zúžení
}

// 4) assertion function
function assertDefined<T>(x: T, what: string): asserts x is NonNullable<T> {
  if (x == null) throw new Error(`${what} is required`);
}
const env: Record<string, string | undefined> = { DB_URL: 'postgres://x' };
const url = env.DB_URL;
assertDefined(url, 'DB_URL');
console.log('DB_URL length:', url.length); // url: string

/* Výstup:
NotFoundError: order o9 not found
non-error thrown: just a string
top: Error: loading invoice for o42 failed
cause NotFoundError? order o42
8080 → port 8080
abc → invalid port: abc
undefined → invalid port: undefined
70000 → invalid port: 70000
DB_URL length: 12
*/

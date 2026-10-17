// Example 03 — concurrency limit: Promise.all(map) vs. pool K workerů (≈ errgroup.SetLimit)
//
//   npx tsx lessons/D3-async-node/examples/03-concurrency-limit.ts

export {}; // modul, ne globální skript (ať se examples nepřekrývají v tsc)

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let inFlight = 0;
let maxInFlight = 0;

async function callApi(id: number): Promise<string> {
  inFlight++;
  maxInFlight = Math.max(maxInFlight, inFlight);
  await sleep(10 + (id % 3) * 10); // různě dlouhé requesty
  inFlight--;
  return `user-${id}`;
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0; // sdílený index — žádný mutex: mezi čtením a ++ není await

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const ids = Array.from({ length: 50 }, (_, i) => i);

  maxInFlight = 0;
  let t = Date.now();
  await Promise.all(ids.map(callApi));
  console.log(`Promise.all(map):          max souběžně = ${maxInFlight}, ${Date.now() - t} ms`);

  maxInFlight = 0;
  t = Date.now();
  const res = await mapWithConcurrency(ids, 5, callApi);
  console.log(`mapWithConcurrency(5):     max souběžně = ${maxInFlight}, ${Date.now() - t} ms`);
  console.log(`pořadí zachováno: ${res.slice(0, 5).join(', ')} …`);

  // Logický race mezi awaity: check-then-act není atomický
  const cache = new Map<string, string>();
  let loads = 0;
  async function getNaive(k: string) {
    if (!cache.has(k)) {
      loads++;
      await sleep(10);
      cache.set(k, `v-${k}`);
    }
    return cache.get(k)!;
  }
  await Promise.all([getNaive('x'), getNaive('x'), getNaive('x')]);
  console.log(`naivní cache: load zavolán ${loads}× (race na await hranici)`);

  // Fix: ukládej Promise, ne hodnotu (≈ singleflight)
  const pcache = new Map<string, Promise<string>>();
  loads = 0;
  function getSingleflight(k: string) {
    let p = pcache.get(k);
    if (!p) {
      loads++;
      p = sleep(10).then(() => `v-${k}`);
      pcache.set(k, p);
    }
    return p;
  }
  await Promise.all([getSingleflight('x'), getSingleflight('x'), getSingleflight('x')]);
  console.log(`promise cache: load zavolán ${loads}×`);
}

main();

/* Výstup:
Promise.all(map):          max souběžně = 50, 32 ms
mapWithConcurrency(5):     max souběžně = 5, 214 ms
pořadí zachováno: user-0, user-1, user-2, user-3, user-4 …
naivní cache: load zavolán 3× (race na await hranici)
promise cache: load zavolán 1×
*/

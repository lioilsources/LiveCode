// Example 04 — AbortSignal jako context.Context + CPU práce blokuje event loop
//
//   npx tsx lessons/D3-async-node/examples/04-abort-and-blocking.ts

export {}; // modul, ne globální skript (ať se examples nepřekrývají v tsc)

const t0 = Date.now();
const log = (msg: string) => console.log(`${String(Date.now() - t0).padStart(4)} ms  ${msg}`);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// "Služba", která respektuje signal a předává ho dolů — jako ctx v Go
async function step(name: string, ms: number, signal: AbortSignal) {
  signal.throwIfAborted();
  log(`start ${name}`);
  await sleep(ms, signal);
  log(`done  ${name}`);
}

async function handleRequest(signal: AbortSignal) {
  await step('db', 30, signal);
  await step('external api', 100, signal); // tady to timeout utne
  await step('render', 10, signal);        // sem se nedojde
}

async function main() {
  console.log('== 1) AbortSignal.timeout ≈ context.WithTimeout');
  try {
    await handleRequest(AbortSignal.timeout(80));
  } catch (e) {
    log(`zrušeno: ${(e as Error).name} — ${(e as Error).message}`);
  }

  console.log('\n== 2) AbortSignal.any ≈ strom contextů (rodič zruší i dítě)');
  const parent = new AbortController();
  const child = AbortSignal.any([parent.signal, AbortSignal.timeout(1000)]);
  setTimeout(() => parent.abort(new Error('client disconnected')), 40);
  try {
    await handleRequest(child);
  } catch (e) {
    log(`zrušeno: ${(e as Error).message}`);
  }

  console.log('\n== 3) CPU-bound práce zablokuje event loop');
  let ticks = 0;
  const iv = setInterval(() => log(`tick ${++ticks}`), 50);
  await sleep(120);
  log('začínám 300 ms busy loop…');
  const end = Date.now() + 300;
  while (Date.now() < end) { /* "počítám hash" */ }
  log('busy loop konec — žádný tick během něj neproběhl');
  await sleep(120);
  clearInterval(iv);
}

main();

/* Výstup:
== 1) AbortSignal.timeout ≈ context.WithTimeout
   0 ms  start db
  31 ms  done  db
  32 ms  start external api
  81 ms  zrušeno: TimeoutError — The operation was aborted due to timeout

== 2) AbortSignal.any ≈ strom contextů (rodič zruší i dítě)
  82 ms  start db
 113 ms  done  db
 113 ms  start external api
 123 ms  zrušeno: client disconnected

== 3) CPU-bound práce zablokuje event loop
 174 ms  tick 1
 224 ms  tick 2
 244 ms  začínám 300 ms busy loop…
 544 ms  busy loop konec — žádný tick během něj neproběhl
 545 ms  tick 3
 595 ms  tick 4
 645 ms  tick 5
*/

// Example 02 — Promise je eager; sekvenčně vs. paralelně; Promise.all NEruší ostatní
//
//   npx tsx lessons/D3-async-node/examples/02-eager-and-all.ts

export {}; // modul, ne globální skript (ať se examples nepřekrývají v tsc)

const t0 = Date.now();
const log = (msg: string) => console.log(`${String(Date.now() - t0).padStart(4)} ms  ${msg}`);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function job(name: string, ms: number, fail = false): Promise<string> {
  log(`start ${name}`);
  await sleep(ms);
  if (fail) {
    log(`FAIL  ${name}`);
    throw new Error(`${name} failed`);
  }
  log(`done  ${name}`);
  return name;
}

async function main() {
  console.log('== 1) eager: práce startuje při vytvoření Promise, ne při await');
  const p = job('eager', 50);
  log('promise vytvořen, ještě jsem neawaitnul');
  await p;

  console.log('\n== 2) sekvenčně (await ve smyčce) — ~3 × 50 ms');
  let start = Date.now();
  for (const n of ['a', 'b', 'c']) await job(n, 50);
  log(`sekvenčně trvalo ${Date.now() - start} ms`);

  console.log('\n== 3) paralelně (Promise.all + map) — ~50 ms');
  start = Date.now();
  const res = await Promise.all(['a', 'b', 'c'].map((n) => job(n, 50)));
  log(`paralelně trvalo ${Date.now() - start} ms, výsledky v pořadí: ${res.join(',')}`);

  console.log('\n== 4) Promise.all je fail-fast, ale NEZRUŠÍ ostatní');
  try {
    await Promise.all([job('fast-fail', 20, true), job('slow', 80)]);
  } catch (e) {
    log(`all rejectnul: ${(e as Error).message} — ale 'slow' pořád běží…`);
  }
  await sleep(100); // počkej, uvidíš "done slow" až po rejectu

  console.log('\n== 5) allSettled — počká na všechno, nikdy nerejectne');
  const settled = await Promise.allSettled([job('ok', 10), job('bad', 10, true)]);
  for (const s of settled) {
    log(s.status === 'fulfilled' ? `fulfilled: ${s.value}` : `rejected: ${(s.reason as Error).message}`);
  }

  console.log('\n== 6) race vs any');
  const r = await Promise.race([job('r-fail', 10, true), job('r-ok', 30)]).catch((e: Error) => `race chyba: ${e.message}`);
  log(`race → ${r}`);
  const a = await Promise.any([job('a-fail', 10, true), job('a-ok', 30)]);
  log(`any → ${a}`);
}

main();

/* Výstup (časy se mohou lišit o pár ms):
== 1) eager: práce startuje při vytvoření Promise, ne při await
   0 ms  start eager
   0 ms  promise vytvořen, ještě jsem neawaitnul
  51 ms  done  eager

== 2) sekvenčně (await ve smyčce) — ~3 × 50 ms
  51 ms  start a
 102 ms  done  a
 102 ms  start b
 153 ms  done  b
 153 ms  start c
 204 ms  done  c
 204 ms  sekvenčně trvalo 153 ms

== 3) paralelně (Promise.all + map) — ~50 ms
 204 ms  start a
 204 ms  start b
 204 ms  start c
 255 ms  done  a
 255 ms  done  b
 255 ms  done  c
 255 ms  paralelně trvalo 51 ms, výsledky v pořadí: a,b,c

== 4) Promise.all je fail-fast, ale NEZRUŠÍ ostatní
 255 ms  start fast-fail
 255 ms  start slow
 276 ms  FAIL  fast-fail
 276 ms  all rejectnul: fast-fail failed — ale 'slow' pořád běží…
 336 ms  done  slow

== 5) allSettled — počká na všechno, nikdy nerejectne
 377 ms  start ok
 377 ms  start bad
 388 ms  done  ok
 388 ms  FAIL  bad
 388 ms  fulfilled: ok
 388 ms  rejected: bad failed

== 6) race vs any
 388 ms  start r-fail
 388 ms  start r-ok
 399 ms  FAIL  r-fail
 399 ms  race → race chyba: r-fail failed
 419 ms  done  r-ok
 419 ms  start a-fail
 419 ms  start a-ok
 430 ms  FAIL  a-fail
 449 ms  done  a-ok
 449 ms  any → a-ok
*/

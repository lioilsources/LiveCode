// Example 01 — pořadí: sync → nextTick → Promise microtasky → setImmediate → timery
//
//   npx tsx lessons/D3-async-node/examples/01-event-loop-order.ts
//
// Demo běží uvnitř callbacku (macrotasku) — tak je pořadí DETERMINISTICKÉ.
// Na top-levelu modulu jsou dvě nuance (viz konec souboru a LESSON.md §2).

export {}; // modul, ne globální skript (ať se examples nepřekrývají v tsc)

function demo(): void {
  console.log('1 sync');
  setTimeout(() => console.log('2 timeout'), 0);
  setImmediate(() => console.log('3 immediate'));
  Promise.resolve().then(() => console.log('4 promise'));
  queueMicrotask(() => console.log('5 microtask'));
  process.nextTick(() => console.log('6 nextTick'));
  (async () => {
    console.log('7 async start'); // async fn běží synchronně až do prvního await
    await null;
    console.log('8 after await'); // pokračování po await = microtask
  })();
  Promise.resolve()
    .then(() => console.log('10a promise'))
    .then(() => console.log('10b chained promise')); // microtask zařazený BĚHEM vyprazdňování — pořád před timery
  console.log('9 sync end');
}

setTimeout(demo, 0);

// Top-level nuance: tenhle soubor tsx načítá jako ES modul. V ESM se tělo
// modulu vykoná uvnitř Promise jobu → Promise microtasky proběhnou DŘÍV než
// nextTick. A setTimeout(0) vs setImmediate na top-levelu závisí na tom, jak
// rychle loop nastartuje — negarantováno.
process.nextTick(() => console.log('top-level nextTick'));
Promise.resolve().then(() => console.log('top-level promise'));

/* Výstup:
top-level promise
top-level nextTick
1 sync
7 async start
9 sync end
6 nextTick
4 promise
5 microtask
8 after await
10a promise
10b chained promise
3 immediate
2 timeout
*/

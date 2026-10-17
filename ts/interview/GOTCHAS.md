# GOTCHAS — „co to vypíše?" (TS / Node)

> Mini programy, které se dávají na pohovoru ústně nebo jako „najdi bug".
> Nejdřív si odpověz nahlas, pak rozklikni. Každý snippet je ověřený přes
> `npx tsx` (Node 22) — zkopíruj do souboru a pusť sám:
>
> ```bash
> npx tsx /tmp/g.ts
> ```
>
> Go analogie jsou u každého — tam, kde Go dělá něco jinak, je past největší.

---

## 1. Event loop: sync, microtasky, nextTick, timer

```ts
setTimeout(() => {
  console.log('A');
  setTimeout(() => console.log('B timeout'), 0);
  Promise.resolve().then(() => console.log('C then'));
  process.nextTick(() => console.log('D nextTick'));
  (async () => {
    console.log('E async start');
    await null;
    console.log('F after await');
  })();
  console.log('G');
}, 0);
```

<details><summary>Odpověď</summary>

```
A
E async start
G
D nextTick
C then
F after await
B timeout
```

1. **Synchronní kód doběhne celý** — včetně těla `async` funkce **až po první `await`** (`E`).
2. Pak **`process.nextTick` fronta** (`D`) — Node-specifická, má přednost.
3. Pak **microtasky** (Promise `.then`, pokračování po `await`) v pořadí zařazení (`C`, `F`).
4. Až pak **macrotask** — další timer (`B`).

Pravidlo: *sync → nextTick → microtasky → macrotasky (timery, I/O, setImmediate)*.
Mezi každými dvěma macrotasky se microtask fronta **vyprázdní celá**.

⚠️ Nuance: na **top-level** ES modulu (a pod `tsx`) se `nextTick` spustí **až po**
promise microtaskech, protože vyhodnocení modulu samo běží jako microtask.
A `setTimeout(…, 0)` vs `setImmediate` na top-levelu je **nedeterministické**
(uvnitř I/O callbacku vyhraje vždy `setImmediate`). Proto je snippet zabalený
v `setTimeout` — tak vypadá kód v request handleru.

Go: nic takového neexistuje — goroutiny plánuje scheduler preemptivně, pořadí
nezaručuje nic. V Node je pořadí **deterministické** a ptají se na něj.
</details>

---

## 2. `forEach` s async callbackem

```ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const ids = [1, 2, 3];
  ids.forEach(async (id) => {
    await sleep(10);
    console.log('saved', id);
  });
  console.log('done');
}
main();
```

<details><summary>Odpověď</summary>

```
done
saved 1
saved 2
saved 3
```

`forEach` **ignoruje návratovou hodnotu** callbacku — vrácené Promises zahodí
a nečeká na ně. `done` se vypíše hned, chyby z callbacků jsou **unhandled
rejection**.

Fix: sekvenčně `for (const id of ids) await save(id);`, paralelně
`await Promise.all(ids.map(save))`.

Go analogie: `for … { go save(id) }` bez `WaitGroup`.
</details>

---

## 3. `await` ve smyčce

```ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fetchUser = async (id: number) => { await sleep(100); return id; };

async function main() {
  let t = Date.now();
  for (const id of [1, 2, 3]) await fetchUser(id);
  console.log('loop', Date.now() - t);

  t = Date.now();
  await Promise.all([1, 2, 3].map(fetchUser));
  console.log('all', Date.now() - t);
}
main();
```

<details><summary>Odpověď</summary>

```
loop ~300
all  ~100
```

`await` ve smyčce = **sekvenčně**. `map` + `Promise.all` = **paralelně**
(Promise startuje už v okamžiku vytvoření, `all` jen čeká).

Kdy je smyčka správně: pořadí záleží, další krok závisí na předchozím, nebo
chceš šetřit downstream. Pro 10 000 položek ale **ani `Promise.all`** — to je
10 000 souběžných requestů; použij concurrency limit (pool / `p-limit`).

ESLint pravidlo `no-await-in-loop` existuje přesně kvůli tomuhle.
</details>

---

## 4. `Promise.all` při chybě

```ts
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function job(name: string, ms: number, fail = false) {
  await sleep(ms);
  if (fail) throw new Error(name + ' failed');
  console.log(name, 'finished');
  return name;
}

async function main() {
  try {
    await Promise.all([job('a', 50, true), job('b', 100), job('c', 150)]);
  } catch (e) {
    console.log('caught:', (e as Error).message);
  }
}
main();
```

<details><summary>Odpověď</summary>

```
caught: a failed
b finished
c finished
```

`Promise.all` **rejectne při první chybě**, ale **ostatní Promises běží dál** —
Promise nejde zvenku zrušit. `b` a `c` doběhnou (a jejich vedlejší efekty se
stanou), jen jejich výsledek nikoho nezajímá.

Chceš opravdu zrušit? `AbortController` + předat `signal` do každého jobu
a v `catch` zavolat `controller.abort()`. To je přesně `errgroup.WithContext`
z Go — jen ruční.

Chceš všechny výsledky včetně chyb? `Promise.allSettled`.
</details>

---

## 5. `sort()` bez comparatoru

```ts
console.log([10, 1, 2, 25].sort());
console.log([10, 1, 2, 25].sort((a, b) => a - b));

const a = [3, 1, 2];
const b = a.sort();
console.log(a === b, a);
```

<details><summary>Odpověď</summary>

```
[ 1, 10, 2, 25 ]
[ 1, 2, 10, 25 ]
true [ 1, 2, 3 ]
```

Default `sort` převádí prvky na **stringy** a řadí lexikograficky. Čísla vždy
s comparatorem `(a, b) => a - b`.

A `sort` **mutuje** pole a vrací tu samou referenci. Bez mutace:
`[...a].sort(...)` nebo `a.toSorted(...)` (ES2023).
</details>

---

## 6. `||` vs `??`

```ts
const limit1 = 0 || 10;
const limit2 = 0 ?? 10;
const name1 = '' || 'anon';
const name2 = '' ?? 'anon';
console.log(limit1, limit2, JSON.stringify(name1), JSON.stringify(name2));
```

<details><summary>Odpověď</summary>

```
10 0 "anon" ""
```

`||` sáhne po defaultu pro **jakoukoli falsy** hodnotu (`0`, `''`, `false`,
`NaN`, `null`, `undefined`). `??` jen pro **`null` / `undefined`**.

Klasický bug: `const page = query.page || 1` je OK, ale
`const discount = input.discount || 10` z nuly udělá 10 %. Defaulty piš přes `??`.
</details>

---

## 7. `typeof`

```ts
console.log(typeof null, typeof undefined, typeof [], Array.isArray([]), typeof NaN);
console.log(NaN === NaN, Number.isNaN(NaN));
```

<details><summary>Odpověď</summary>

```
object undefined object true number
false true
```

`typeof null === 'object'` je historický bug jazyka. Pole je taky `'object'` —
na pole `Array.isArray`. `NaN` je číslo a nerovná se ničemu, ani sobě
→ `Number.isNaN`.
</details>

---

## 8. `==` vs `===`

```ts
const x: any = '0';
console.log(x == 0, x === 0, null == undefined, null === undefined, [] == (false as any), '' == (0 as any));
```

<details><summary>Odpověď</summary>

```
true false true false true true
```

`==` dělá **type coercion** podle složitých pravidel. Vždy `===`.
Jediná rozumná výjimka: `x == null` jako zkratka pro `x === null || x === undefined`
(i to radši `x ?? …` nebo explicitně).
</details>

---

## 9. `this` a předaná metoda

```ts
class Counter {
  count = 0;
  inc() { this.count++; return this.count; }
  incArrow = () => { this.count++; return this.count; };
}

const c = new Counter();
const f = c.incArrow;
console.log(f());
const g = c.inc;
console.log(g());
```

<details><summary>Odpověď</summary>

```
1
TypeError: Cannot read properties of undefined (reading 'count')
```

`this` v běžné metodě určuje **volající** (`c.inc()` → `this = c`). Vytrhneš-li
metodu (`const g = c.inc`, `arr.map(c.inc)`, `setTimeout(c.inc)`,
`emitter.on('x', this.handle)`), `this` je `undefined` (třídy jsou ve strict mode).

Arrow funkce jako **pole třídy** si `this` zachytí při vytvoření instance.
Fix: arrow pole, `c.inc.bind(c)`, nebo `() => c.inc()`.

Go: method value `g := c.Inc` si receiver **pamatuje**. V JS ne.
</details>

---

## 10. `var` vs `let` v closure ve smyčce

```ts
const fns1: Array<() => number> = [];
for (var i = 0; i < 3; i++) fns1.push(() => i);

const fns2: Array<() => number> = [];
for (let j = 0; j < 3; j++) fns2.push(() => j);

console.log(fns1.map((f) => f()), fns2.map((f) => f()));
```

<details><summary>Odpověď</summary>

```
[ 3, 3, 3 ] [ 0, 1, 2 ]
```

`var` má function scope → jedna proměnná pro všechny iterace. `let` má block
scope → nová proměnná **v každé iteraci**.

Go: přesně loop variable capture před Go 1.22 (a `let` = chování od 1.22).
V TS prostě nikdy `var`.
</details>

---

## 11. Spread je mělká kopie

```ts
const original = { name: 'Olda', address: { city: 'Brno' }, tags: ['a'] };
const copy = { ...original };
copy.name = 'Eva';
copy.address.city = 'Praha';
copy.tags.push('b');
console.log(original.name, original.address.city, original.tags);

const deep = structuredClone(original);
deep.address.city = 'Ostrava';
console.log(original.address.city);
```

<details><summary>Odpověď</summary>

```
Olda Praha [ 'a', 'b' ]
Praha
```

`{ ...obj }` kopíruje jen **první úroveň**; vnořené objekty a pole jsou sdílené
reference. Hluboká kopie: `structuredClone` (Node 17+).

Go: kopie structu, který obsahuje slice nebo mapu — stejná past. `readonly`
v TS mutaci za běhu nezabrání, jen ji zakáže typově.
</details>

---

## 12. `JSON.stringify` — co tiše zmizí

```ts
console.log(JSON.stringify({
  a: undefined,
  b: null,
  c: new Date(0),
  d: new Map([['k', 1]]),
  e: new Set([1]),
  f: () => 1,
  g: NaN,
  h: [undefined, () => 1],
}));
JSON.stringify({ n: 10n });
```

<details><summary>Odpověď</summary>

```
{"b":null,"c":"1970-01-01T00:00:00.000Z","d":{},"e":{},"g":null,"h":[null,null]}
TypeError: Do not know how to serialize a BigInt
```

- `undefined` a funkce ve **vlastnosti** zmizí, v **poli** se z nich stane `null`.
- `Date` → ISO string (a zpátky přes `JSON.parse` **zůstane string**, ne Date!).
- `Map` / `Set` → `{}` — data tiše zmizí. Převeď: `Object.fromEntries(map)`, `[...set]`.
- `NaN` / `Infinity` → `null`.
- `BigInt` → **výjimka**.

V Nestu se tohle děje při každé odpovědi controlleru — vrátíš-li `Map`, klient dostane `{}`.
</details>

---

## 13. Čísla

```ts
console.log(0.1 + 0.2 === 0.3, 0.1 + 0.2);
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);
console.log(9007199254740993n + 1n);
console.log(parseInt('08'), parseInt('12px'), Number('12px'), Number(''), parseInt(''));
console.log(['1', '2', '3'].map(parseInt));
```

<details><summary>Odpověď</summary>

```
false 0.30000000000000004
true
9007199254740994n
8 12 NaN 0 NaN
[ 1, NaN, NaN ]
```

- Jediný číselný typ `number` = float64. Žádný `int`. Peníze v **centech jako
  celé číslo** (nebo decimal knihovna), nikdy float.
- Nad `2^53 − 1` ztráta přesnosti → `BigInt` (`123n`). Pozor na 64bit ID
  z DB: Postgres `bigint` vrací `pg` driver jako **string**.
- `parseInt` čte, dokud to jde (`'12px'` → 12); `Number` chce celý string
  (`'12px'` → NaN), ale `Number('')` je **0**.
- `map(parseInt)` — `map` předá `(value, index)`, `parseInt` bere `(string, radix)`
  → `parseInt('2', 1)` = NaN. Piš `map(Number)` nebo `map((s) => parseInt(s, 10))`.
</details>

---

## 14. `as` nic neověří

```ts
interface User { id: number; email: string }

const body: unknown = JSON.parse('{"id":"7","mail":"x@y.cz"}');
const user = body as User;
console.log(typeof user.id, user.email, user.id + 1);
```

<details><summary>Odpověď</summary>

```
string undefined 71
```

`as User` je **jen pokyn kompilátoru** („věř mi"), za běhu se nic nekontroluje
— typy se při kompilaci smažou (type erasure). TS je spokojený, data jsou
špatně, `user.id + 1` dělá konkatenaci stringů.

Na hranici systému (HTTP body, env, zpráva z fronty, odpověď cizí API)
**vždy runtime validace**: v Nestu DTO + `class-validator` + `ValidationPipe`,
jinde `zod` (`User.parse(body)`), nebo vlastní type guard `isUser(x): x is User`.

Go: `json.Unmarshal` do structu aspoň typy polí zkontroluje. TS ani to ne.
</details>

---

## 15. Floating promise

```ts
async function save(): Promise<void> {
  throw new Error('db down');
}

function handler() {
  try {
    save();               // chybí await
    console.log('saved!');
  } catch (e) {
    console.log('caught', e);
  }
}

handler();
setTimeout(() => console.log('still alive?'), 50);
```

<details><summary>Odpověď</summary>

```
saved!
Error: db down        ← unhandled rejection, proces spadne (exit code 1)
```

`still alive?` se **nevypíše**. Bez `await` `try/catch` chybu nechytí — async
funkce chybu nehází, ale vrací **rejected Promise**. Nikdo na ni nečeká →
**unhandled rejection** → od Node 15 **proces skončí**.

Na serveru to znamená: jeden zapomenutý `await` v handleru = pád celé služby
pro všechny requesty. Klient navíc dostal „saved!", i když se nic neuložilo.

Fix: `await save()`. Ochrana: ESLint `@typescript-eslint/no-floating-promises`;
pro záměrný fire-and-forget explicitně `void save().catch(log)`.

Go: jako ignorovaný `err` — jenže tady to navíc shodí proces.
</details>

---

## Tahák: co si zapamatovat

| # | Pravidlo |
|---|---|
| 1 | sync → `nextTick` → microtasky → timery/I/O |
| 2–3 | `forEach` nečeká; `await` ve smyčce je sekvenční; paralelně `Promise.all(map)` s limitem |
| 4 | `Promise.all` nic neruší — zrušení = `AbortController` |
| 5 | `sort` bez comparatoru řadí stringy a mutuje |
| 6 | defaulty přes `??`, ne `\|\|` |
| 7–8 | `===` vždy; `typeof null === 'object'` |
| 9 | předaná metoda ztratí `this` → arrow pole / `bind` |
| 10 | nikdy `var` |
| 11 | spread je mělký → `structuredClone` |
| 12 | `JSON.stringify` tiše zahodí `undefined`, `Map`, `Set` |
| 13 | `number` je float64; peníze v centech; `map(parseInt)` je bug |
| 14 | `as` neověřuje — validuj na hranici |
| 15 | každý Promise buď `await`, nebo `.catch` |

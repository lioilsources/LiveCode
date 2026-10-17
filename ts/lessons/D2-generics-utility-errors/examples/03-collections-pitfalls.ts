// Kolekce: sort past, Map/Set, for…of vs for…in, groupBy, mělká kopie.
//   npx tsx lessons/D2-generics-utility-errors/examples/03-collections-pitfalls.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

// 1) sort: lexikograficky + mutuje
const nums = [10, 9, 1, 100];
console.log('sort():', [...nums].sort());
console.log('sort((a,b)=>a-b):', [...nums].sort((a, b) => a - b));
const ref = nums.sort((a, b) => b - a);
console.log('sort mutuje — stejná reference?', ref === nums, nums);
console.log('toSorted nemutuje:', nums.toSorted((a, b) => a - b), nums);

// 2) víc klíčů: score desc, pak name asc
const users = [
  { name: 'Cyril', score: 7 },
  { name: 'Ann', score: 9 },
  { name: 'Bob', score: 7 },
];
console.log(
  'multi-key:',
  users.toSorted((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((u) => u.name),
);

// 3) Map pro frekvence, Set pro dedup
const words = 'the cat and the hat and the bat'.split(' ');
const freq = new Map<string, number>();
for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
console.log('freq:', freq);
const top2 = [...freq].toSorted(([wa, a], [wb, b]) => b - a || wa.localeCompare(wb)).slice(0, 2);
console.log('top2:', top2);
console.log('unique:', [...new Set(words)]);
console.log('Set objektů dedupuje referencí:', new Set([{ a: 1 }, { a: 1 }]).size);

// 4) Objekt jako mapa: číselné klíče se stanou stringy
const obj: Record<string, string> = {};
obj[1] = 'one';
console.log('Object.keys:', Object.keys(obj), '| typeof key:', typeof Object.keys(obj)[0]);

// 5) for…of vs for…in
const arr = [10, 20];
for (const x of arr) console.log('for…of →', x);
for (const i in arr) console.log('for…in →', JSON.stringify(i));
for (const [i, x] of arr.entries()) console.log('entries →', i, x);

// 6) groupBy (Node 21+); typy potřebují lib ES2024, proto ruční verze
const orders = [
  { id: 'a', status: 'paid', total: 100 },
  { id: 'b', status: 'open', total: 50 },
  { id: 'c', status: 'paid', total: 25 },
];
function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const it of items) {
    const k = keyFn(it);
    const g = out.get(k);
    if (g) g.push(it);
    else out.set(k, [it]);
  }
  return out;
}
const groups = groupBy(orders, (o) => o.status);
console.log('groupBy:', [...groups].map(([k, v]) => `${k}=${v.map((o) => o.id).join('')}`));
console.log('sum paid:', (groups.get('paid') ?? []).reduce((s, o) => s + o.total, 0));
try {
  ([] as number[]).reduce((s, x) => s + x);
} catch (e) {
  console.log('reduce bez init na []:', (e as Error).constructor.name);
}

// 7) Mělká kopie
const a = { tags: ['x'], meta: { v: 1 } };
const b = { ...a };
b.tags.push('y');
b.meta.v = 2;
console.log('po úpravě kopie a =', JSON.stringify(a));
const c = structuredClone(a);
c.tags.push('z');
console.log('structuredClone nezasáhne a =', JSON.stringify(a.tags));

// 8) Destructuring + rest = Omit za běhu
const { id, ...withoutId } = { id: 'u1', name: 'Ann', role: 'admin' };
console.log('rest:', id, withoutId);

/* Výstup:
sort(): [ 1, 10, 100, 9 ]
sort((a,b)=>a-b): [ 1, 9, 10, 100 ]
sort mutuje — stejná reference? true [ 100, 10, 9, 1 ]
toSorted nemutuje: [ 1, 9, 10, 100 ] [ 100, 10, 9, 1 ]
multi-key: [ 'Ann', 'Bob', 'Cyril' ]
freq: Map(5) { 'the' => 3, 'cat' => 1, 'and' => 2, 'hat' => 1, 'bat' => 1 }
top2: [ [ 'the', 3 ], [ 'and', 2 ] ]
unique: [ 'the', 'cat', 'and', 'hat', 'bat' ]
Set objektů dedupuje referencí: 2
Object.keys: [ '1' ] | typeof key: string
for…of → 10
for…of → 20
for…in → "0"
for…in → "1"
entries → 0 10
entries → 1 20
groupBy: [ 'paid=ac', 'open=b' ]
sum paid: 125
reduce bez init na []: TypeError
po úpravě kopie a = {"tags":["x","y"],"meta":{"v":2}}
structuredClone nezasáhne a = ["x","y"]
rest: u1 { name: 'Ann', role: 'admin' }
*/

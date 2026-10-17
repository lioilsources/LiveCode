// Discriminated union + exhaustiveness přes never (= Go sealed interface + type switch, ale lépe).
//   npx tsx lessons/D1-ts-basics/examples/02-discriminated-union.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number }
  | { kind: 'square'; side: number };

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.r ** 2; // s je zúžené na {kind:'circle', r}
    case 'rect':
      return s.w * s.h;
    case 'square':
      return s.side ** 2;
    default:
      // Přidej do Shape variantu { kind: 'triangle'; ... } → tady vznikne compile error.
      return assertNever(s);
  }
}

const shapes: Shape[] = [
  { kind: 'circle', r: 1 },
  { kind: 'rect', w: 2, h: 3 },
  { kind: 'square', side: 4 },
];
for (const s of shapes) console.log(s.kind.padEnd(7), area(s).toFixed(2));

// Narrowing dalšími ochranami:
function describe(v: string | number | Date | null): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return `string(${v.length})`;
  if (typeof v === 'number') return `number(${v.toFixed(1)})`;
  return `date(${v.toISOString().slice(0, 10)})`; // zbyl jen Date
}
console.log([null, 'abc', 3.14159, new Date('2026-10-17')].map(describe).join(' | '));

// `in` pro uniony bez diskriminátoru:
type Fish = { swim(): string };
type Bird = { fly(): string };
const move = (a: Fish | Bird) => ('swim' in a ? a.swim() : a.fly());
console.log(move({ swim: () => 'plave' }), move({ fly: () => 'letí' }));

// Za běhu je to jen objekt — kdyby přišel z JSONu s neznámým kind, chytí to assertNever:
try {
  area(JSON.parse('{"kind":"triangle","a":1}') as Shape); // `as` je lež kompilátoru
} catch (e) {
  console.log('runtime:', e instanceof Error ? e.message : e);
}

/* Výstup:
circle  3.14
rect    6.00
square  16.00
null | string(3) | number(3.1) | date(2026-10-17)
plave letí
runtime: Unhandled variant: {"kind":"triangle","a":1}
*/

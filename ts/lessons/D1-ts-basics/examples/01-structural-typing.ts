// Structural typing: kompatibilita podle tvaru, ne podle jména.
//   npx tsx lessons/D1-ts-basics/examples/01-structural-typing.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

interface Point {
  x: number;
  y: number;
}

class Vec {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

function len(p: Point): number {
  return Math.hypot(p.x, p.y);
}

// 1) Třída bez "implements" pasuje do interfacu — stejně jako v Go.
console.log('Vec(3,4):', len(new Vec(3, 4)));

// 2) Properties navíc přes proměnnou nevadí (podtyp)...
const p3 = { x: 6, y: 8, z: 100 };
console.log('p3 přes proměnnou:', len(p3));

// ...ale čerstvý literál s properties navíc kompilátor odmítne:
// len({ x: 1, y: 2, z: 3 }); // ❌ Object literal may only specify known properties

// 3) Dvě různé třídy se stejným tvarem jsou zaměnitelné (v Go by nebyly).
class UserId {
  constructor(public value: string) {}
}
class OrderId {
  constructor(public value: string) {}
}
const oops: UserId = new OrderId('o-1'); // ✅ projde!
console.log('UserId ← OrderId:', oops.value, '| instanceof UserId?', oops instanceof UserId);

// 4) Branded type: nominální chování, nula runtime nákladů.
type UserIdB = string & { readonly __brand: 'UserId' };
type OrderIdB = string & { readonly __brand: 'OrderId' };
const asUserId = (s: string) => s as UserIdB;
function loadUser(id: UserIdB): string {
  return `user ${id}`;
}
console.log(loadUser(asUserId('u-1')));
// loadUser('u-1');                  // ❌ string není UserIdB
// loadUser('o-1' as OrderIdB);      // ❌ OrderIdB není UserIdB

// 5) Funkce jsou taky strukturální: méně parametrů je OK.
type Handler = (req: string, attempt: number) => void;
const h: Handler = (req) => console.log('handler dostal jen', req);
h('GET /', 1);

/* Výstup:
Vec(3,4): 5
p3 přes proměnnou: 10
UserId ← OrderId: o-1 | instanceof UserId? false
user u-1
handler dostal jen GET /
*/

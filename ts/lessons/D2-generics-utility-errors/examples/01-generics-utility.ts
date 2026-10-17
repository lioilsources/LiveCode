// Generika, keyof, utility types, as const, satisfies.
//   npx tsx lessons/D2-generics-utility-errors/examples/01-generics-utility.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
}

// 1) Constraint: T musí mít id — ale vrací se celé T, ne ořezaný {id}
function byId<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((i) => i.id === id);
}

// 2) keyof + T[K]: typově bezpečný klíč
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((i) => i[key]);
}

function sortBy<T, K extends keyof T>(items: readonly T[], key: K): T[] {
  return items.toSorted((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
}

const products: Product[] = [
  { id: 'p1', name: 'Mouse', price: 490, createdAt: new Date('2026-01-01') },
  { id: 'p2', name: 'Keyboard', price: 1290, createdAt: new Date('2026-02-01') },
  { id: 'p3', name: 'Cable', price: 99, createdAt: new Date('2026-03-01') },
];

console.log('byId:', byId(products, 'p2')?.name);
console.log('pluck price:', pluck(products, 'price'));
console.log('sortBy price:', sortBy(products, 'price').map((p) => p.name));
// pluck(products, 'prize'); // ❌ Argument of type '"prize"' is not assignable to parameter of type keyof Product

// 3) Utility types: DTO z jednoho zdroje pravdy
type CreateProduct = Omit<Product, 'id' | 'createdAt'>;
type UpdateProduct = Partial<CreateProduct>;

let seq = 3;
function create(dto: CreateProduct): Product {
  return { ...dto, id: `p${++seq}`, createdAt: new Date('2026-10-17') };
}
function update(p: Product, patch: UpdateProduct): Product {
  // odfiltruj undefined, jinak by spread přepsal existující hodnoty
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  return { ...p, ...clean };
}
const created = create({ name: 'Monitor', price: 4990 });
console.log('create:', created.id, created.name);
console.log('update:', update(created, { price: 3990, name: undefined }));

// 4) Record<Union, V> vynutí všechny klíče
type Status = 'open' | 'paid' | 'shipped';
const labels: Record<Status, string> = { open: 'Otevřená', paid: 'Zaplacená', shipped: 'Odeslaná' };
console.log('labels:', Object.values(labels).join(', '));

// 5) as const: jedno pole pro runtime i typ
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];
const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);
console.log('isRole(editor/owner):', isRole('editor'), isRole('owner'));

// 6) satisfies: kontrola + zachování přesných klíčů
const routes = {
  users: '/api/users',
  orders: '/api/orders',
} satisfies Record<string, `/api/${string}`>;
const r: '/api/users' = routes.users; // přesný literal type zůstal
console.log('route:', r);

// 7) ReturnType / Awaited / Parameters
async function loadUser(id: string, withOrders = false) {
  return { id, withOrders, name: 'Ann' };
}
type LoadedUser = Awaited<ReturnType<typeof loadUser>>; // { id: string; withOrders: boolean; name: string }
type LoadArgs = Parameters<typeof loadUser>; // [id: string, withOrders?: boolean]
const args: LoadArgs = ['u1', true];
loadUser(...args).then((u: LoadedUser) => console.log('loaded:', u));

/* Výstup:
byId: Keyboard
pluck price: [ 490, 1290, 99 ]
sortBy price: [ 'Cable', 'Mouse', 'Keyboard' ]
create: p4 Monitor
update: {
  name: 'Monitor',
  price: 3990,
  id: 'p4',
  createdAt: 2026-10-17T00:00:00.000Z
}
labels: Otevřená, Zaplacená, Odeslaná
isRole(editor/owner): true false
route: /api/users
loaded: { id: 'u1', withOrders: true, name: 'Ann' }
*/

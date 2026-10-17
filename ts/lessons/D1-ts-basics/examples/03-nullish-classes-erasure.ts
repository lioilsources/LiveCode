// ?? vs ||, optional chaining, parameter properties, `this` past a type erasure.
//   npx tsx lessons/D1-ts-basics/examples/03-nullish-classes-erasure.ts

export {}; // modul, ať se identifikátory nepletou s ostatními soubory

// 1) ?? vs || — past s 0 a ''
interface Query {
  limit?: number;
  q?: string;
}
const query: Query = { limit: 0, q: '' };
console.log('limit || 10 =', query.limit || 10, '  limit ?? 10 =', query.limit ?? 10);
console.log("q || '*'   =", query.q || '*', "  q ?? '*'   =", JSON.stringify(query.q ?? '*'));

// 2) Optional chaining
type User = { name: string; address?: { city?: string } };
const users: User[] = [{ name: 'A', address: { city: 'Brno' } }, { name: 'B' }];
console.log(users.map((u) => u.address?.city ?? '(neznámé)'));

// 3) Parameter properties — tvar každé Nest služby
interface Repo {
  find(id: string): User | undefined;
}
class UserService {
  constructor(private readonly repo: Repo) {}

  get(id: string): User {
    const u = this.repo.find(id);
    if (!u) throw new Error(`user ${id} not found`);
    return u;
  }
}
const repo: Repo = { find: (id) => users.find((u) => u.name === id) };
const svc = new UserService(repo);
console.log('get(A):', svc.get('A').name);

// `private` je jen compile-time:
console.log('private za běhu:', typeof (svc as any).repo.find);

// 4) `this` past u callbacku
class Counter {
  n = 0;
  inc() {
    this.n++;
  }
  incArrow = () => {
    this.n++;
  };
}
const c = new Counter();
const loose = c.inc;
try {
  loose();
} catch (e) {
  console.log('metoda bez this:', (e as Error).constructor.name);
}
const looseArrow = c.incArrow;
looseArrow();
console.log('arrow property drží this, n =', c.n);

// 5) Type erasure: typ je slib, ne kontrola
interface CreateUserDto {
  email: string;
  age: number;
}
const body = JSON.parse('{"email": 42, "age": "abc", "isAdmin": true}');
const dto: CreateUserDto = body; // JSON.parse vrací any → projde bez varování
console.log('dto.age je ve skutečnosti', typeof dto.age, '| isAdmin pronikl:', 'isAdmin' in dto);

// Runtime validace = skutečný kód:
function isCreateUserDto(x: unknown): x is CreateUserDto {
  return (
    typeof x === 'object' &&
    x !== null &&
    'email' in x &&
    typeof x.email === 'string' &&
    'age' in x &&
    typeof x.age === 'number'
  );
}
console.log('validace:', isCreateUserDto(body), isCreateUserDto({ email: 'a@b.cz', age: 30 }));

/* Výstup:
limit || 10 = 10   limit ?? 10 = 0
q || '*'   = *   q ?? '*'   = ""
[ 'Brno', '(neznámé)' ]
get(A): A
private za běhu: function
metoda bez this: TypeError
arrow property drží this, n = 1
dto.age je ve skutečnosti string | isAdmin pronikl: true
validace: false true
*/

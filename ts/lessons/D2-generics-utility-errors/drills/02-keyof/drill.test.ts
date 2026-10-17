import { indexBy, pluck, sortBy } from './drill';

type User = { id: number; name: string; age: number };
const users: User[] = [
  { id: 3, name: 'Cyril', age: 40 },
  { id: 1, name: 'Ann', age: 25 },
  { id: 2, name: 'Bob', age: 31 },
];

describe('drill 02 — keyof', () => {
  it('pluck', () => {
    const ages: number[] = pluck(users, 'age');
    expect(ages).toEqual([40, 25, 31]);
    // @ts-expect-error — 'agee' není klíč User
    pluck(users, 'agee');
  });

  it('sortBy asc/desc bez mutace', () => {
    const before = users.map((u) => u.id);
    expect(sortBy(users, 'name').map((u) => u.name)).toEqual(['Ann', 'Bob', 'Cyril']);
    expect(sortBy(users, 'age', 'desc').map((u) => u.age)).toEqual([40, 31, 25]);
    expect(sortBy([10, 9, 100].map((n) => ({ n })), 'n').map((x) => x.n)).toEqual([9, 10, 100]);
    expect(users.map((u) => u.id)).toEqual(before);
  });

  it('indexBy', () => {
    const m = indexBy(users, 'id');
    expect(m.get(2)?.name).toBe('Bob');
    expect(m.size).toBe(3);
    const dup = indexBy(
      [
        { k: 'a', v: 1 },
        { k: 'a', v: 2 },
      ],
      'k',
    );
    expect(dup.get('a')?.v).toBe(2);
  });
});

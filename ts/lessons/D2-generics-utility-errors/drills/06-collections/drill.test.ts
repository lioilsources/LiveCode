import { groupBy, topK, uniqueBy, wordFreq } from './drill';

describe('drill 06 — collections', () => {
  it('wordFreq', () => {
    const f = wordFreq('The cat, the HAT... and the bat!');
    expect(f.get('the')).toBe(3);
    expect(f.get('cat')).toBe(1);
    expect(f.has('')).toBe(false);
    expect(f.size).toBe(5);
  });

  it('topK: count desc, pak abecedně', () => {
    const f = new Map([
      ['b', 2],
      ['a', 2],
      ['z', 5],
      ['c', 1],
    ]);
    expect(topK(f, 3)).toEqual([
      ['z', 5],
      ['a', 2],
      ['b', 2],
    ]);
    expect(topK(f, 10)).toHaveLength(4);
  });

  it('groupBy zachová pořadí prvního výskytu', () => {
    const orders = [
      { id: 1, status: 'paid' },
      { id: 2, status: 'open' },
      { id: 3, status: 'paid' },
    ];
    const g = groupBy(orders, (o) => o.status);
    expect([...g.keys()]).toEqual(['paid', 'open']);
    expect(g.get('paid')?.map((o) => o.id)).toEqual([1, 3]);
    expect(groupBy([1, 2, 3, 4], (n) => n % 2 === 0).get(true)).toEqual([2, 4]);
  });

  it('uniqueBy', () => {
    const users = [
      { email: 'A@x.cz', n: 1 },
      { email: 'b@x.cz', n: 2 },
      { email: 'a@x.cz', n: 3 },
    ];
    expect(uniqueBy(users, (u) => u.email.toLowerCase()).map((u) => u.n)).toEqual([1, 2]);
  });
});

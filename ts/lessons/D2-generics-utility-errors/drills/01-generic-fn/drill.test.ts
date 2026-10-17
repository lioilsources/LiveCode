import { byId, chunk, last, Stack } from './drill';

describe('drill 01 — generika', () => {
  it('last', () => {
    expect(last([1, 2, 3])).toBe(3);
    expect(last([])).toBeUndefined();
  });

  it('chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk(['a'], 3)).toEqual([['a']]);
    expect(chunk([], 3)).toEqual([]);
    expect(() => chunk([1], 0)).toThrow(RangeError);
  });

  it('byId vrací celé T', () => {
    const users = [
      { id: 'a', name: 'Ann' },
      { id: 'b', name: 'Bob' },
    ];
    const u = byId(users, 'b');
    const name: string | undefined = u?.name; // kompiluje se jen když vracíš T
    expect(name).toBe('Bob');
    expect(byId(users, 'x')).toBeUndefined();
  });

  it('Stack<T>', () => {
    const s = new Stack<number>();
    expect(s.pop()).toBeUndefined();
    s.push(1);
    s.push(2);
    expect(s.size).toBe(2);
    expect(s.peek()).toBe(2);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
    expect(s.size).toBe(0);
    // @ts-expect-error — Stack<number> nebere string
    s.push('x');
  });
});

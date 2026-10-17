import { collect, err, ok, parseAge, unwrapOr, type Result } from './drill';

describe('drill 05 — Result', () => {
  it('parseAge', () => {
    expect(parseAge('42')).toEqual({ ok: true, value: 42 });
    expect(parseAge('0')).toEqual({ ok: true, value: 0 });
    expect(parseAge('')).toEqual({ ok: false, error: 'invalid age: ' });
    expect(parseAge('4.5')).toEqual({ ok: false, error: 'invalid age: 4.5' });
    expect(parseAge('151')).toEqual({ ok: false, error: 'invalid age: 151' });
    expect(parseAge('abc')).toEqual({ ok: false, error: 'invalid age: abc' });
  });

  it('zúžení na ok', () => {
    const r: Result<number> = parseAge('7');
    if (r.ok) {
      const n: number = r.value;
      expect(n).toBe(7);
    } else {
      throw new Error('should be ok');
    }
  });

  it('collect', () => {
    expect(collect(['1', '2'].map(parseAge))).toEqual(ok([1, 2]));
    expect(collect(['1', 'x', 'y'].map(parseAge))).toEqual(err('invalid age: x'));
    expect(collect([])).toEqual(ok([]));
  });

  it('unwrapOr', () => {
    expect(unwrapOr(parseAge('5'), -1)).toBe(5);
    expect(unwrapOr(parseAge('nope'), -1)).toBe(-1);
  });
});

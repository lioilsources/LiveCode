import { isSignup, parseSignup } from './drill';

describe('drill 06 — unknown guard', () => {
  it('isSignup', () => {
    expect(isSignup({ email: 'a@b.cz', age: 18 })).toBe(true);
    expect(isSignup({ email: 'a@b.cz', age: 30, newsletter: false })).toBe(true);
    expect(isSignup({ email: 'ab.cz', age: 30 })).toBe(false);
    expect(isSignup({ email: 'a@b.cz', age: 17 })).toBe(false);
    expect(isSignup({ email: 'a@b.cz', age: 18.5 })).toBe(false);
    expect(isSignup({ email: 'a@b.cz', age: '30' })).toBe(false);
    expect(isSignup({ email: 'a@b.cz', age: 30, newsletter: 'yes' })).toBe(false);
    expect(isSignup(null)).toBe(false);
    expect(isSignup([])).toBe(false);
    expect(isSignup('a@b.cz')).toBe(false);
  });

  it('parseSignup ořízne neznámá pole', () => {
    expect(parseSignup('{"email":"a@b.cz","age":20,"isAdmin":true}')).toEqual({ email: 'a@b.cz', age: 20 });
    expect(parseSignup('{"email":"a@b.cz","age":20,"newsletter":true}')).toEqual({
      email: 'a@b.cz',
      age: 20,
      newsletter: true,
    });
  });

  it('parseSignup hází', () => {
    expect(() => parseSignup('{"email":"x","age":20}')).toThrow('invalid signup');
    expect(() => parseSignup('not json')).toThrow('invalid signup');
  });

  it('type guard zužuje', () => {
    const x: unknown = { email: 'a@b.cz', age: 40 };
    if (isSignup(x)) {
      const email: string = x.email; // kompiluje se jen díky `x is Signup`
      expect(email).toBe('a@b.cz');
    }
  });
});

import { cityOf, normalize } from './drill';

describe('drill 04 — nullish', () => {
  it('defaulty', () => {
    expect(normalize({})).toEqual({ page: 1, limit: 20, q: '', sort: 'asc' });
  });

  it('0 a prázdný string jsou platné (žádné ||)', () => {
    expect(normalize({ page: 0, limit: 0, q: '' })).toEqual({ page: 0, limit: 0, q: '', sort: 'asc' });
  });

  it('limit max 100', () => {
    expect(normalize({ limit: 500, sort: 'desc' })).toEqual({ page: 1, limit: 100, q: '', sort: 'desc' });
  });

  it('cityOf', () => {
    expect(cityOf({ customer: { address: { city: 'Praha' } } })).toBe('Praha');
    expect(cityOf({ customer: {} })).toBe('unknown');
    expect(cityOf({})).toBe('unknown');
    expect(cityOf(null)).toBe('unknown');
    expect(cityOf(undefined)).toBe('unknown');
  });
});

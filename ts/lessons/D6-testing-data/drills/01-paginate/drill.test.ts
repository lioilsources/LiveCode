import { Page, paginate } from './drill';

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  test.each([
    { page: 1, limit: 10, want: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { page: 3, limit: 10, want: [21, 22, 23] },
    { page: 4, limit: 10, want: [] },
    { page: 2, limit: 5, want: [6, 7, 8, 9, 10] },
  ])('page=$page limit=$limit', ({ page, limit, want }) => {
    const got: Page<number> = paginate(items, page, limit);
    expect(got).toEqual({ items: want, total: 23, page, limit });
  });

  it('je generická (funguje i pro objekty)', () => {
    const users = [{ name: 'a' }, { name: 'b' }];
    const got = paginate(users, 1, 1);
    expect(got.items[0]?.name).toBe('a');
    expect(got.total).toBe(2);
  });

  it('nemutuje vstup', () => {
    const copy = [...items];
    paginate(items, 2, 10);
    expect(items).toEqual(copy);
  });

  it.each([
    [0, 10],
    [1, 0],
    [-1, 5],
  ])('page=%i limit=%i → RangeError', (page, limit) => {
    expect(() => paginate(items, page, limit)).toThrow(RangeError);
  });
});

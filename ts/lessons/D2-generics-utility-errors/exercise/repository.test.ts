import { InMemoryRepository, NotFoundError } from './repository';
import { topCustomers, type Order } from './stats';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

function makeRepo() {
  let n = 0;
  return new InMemoryRepository<Product>(() => `p${++n}`);
}

describe('InMemoryRepository', () => {
  it('create přidělí id a vrátí entitu', () => {
    const repo = makeRepo();
    const p = repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    expect(p).toEqual({ id: 'p1', name: 'Mouse', price: 490, category: 'hw' });
    expect(repo.create({ name: 'Cable', price: 99, category: 'hw' }).id).toBe('p2');
  });

  it('findById / getById', () => {
    const repo = makeRepo();
    repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    expect(repo.findById('p1')?.name).toBe('Mouse');
    expect(repo.findById('nope')).toBeUndefined();
    expect(() => repo.getById('nope')).toThrow(NotFoundError);
    expect(() => repo.getById('nope')).toThrow('entity nope not found');
  });

  it('nevrací referenci na interní stav', () => {
    const repo = makeRepo();
    const p = repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    p.price = 1;
    repo.getById('p1').price = 2;
    expect(repo.getById('p1').price).toBe(490);
  });

  it('update merguje, ignoruje undefined, nemění id', () => {
    const repo = makeRepo();
    repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    const u = repo.update('p1', { price: 390, name: undefined });
    expect(u).toEqual({ id: 'p1', name: 'Mouse', price: 390, category: 'hw' });
    expect(repo.getById('p1').price).toBe(390);
    expect(() => repo.update('nope', { price: 1 })).toThrow(NotFoundError);
  });

  it('delete', () => {
    const repo = makeRepo();
    repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    expect(repo.delete('p1')).toBe(true);
    expect(repo.delete('p1')).toBe(false);
    expect(repo.findById('p1')).toBeUndefined();
  });

  it('findBy', () => {
    const repo = makeRepo();
    repo.create({ name: 'Mouse', price: 490, category: 'hw' });
    repo.create({ name: 'Book', price: 490, category: 'books' });
    repo.create({ name: 'Cable', price: 99, category: 'hw' });
    expect(repo.findBy({ category: 'hw' }).map((p) => p.name)).toEqual(['Mouse', 'Cable']);
    expect(repo.findBy({ category: 'hw', price: 490 }).map((p) => p.name)).toEqual(['Mouse']);
    expect(repo.findBy({})).toHaveLength(3);
  });

  it('list: řazení + stránkování + total', () => {
    const repo = makeRepo();
    for (const [name, price] of [
      ['C', 30],
      ['A', 10],
      ['E', 100],
      ['B', 9],
      ['D', 40],
    ] as const) {
      repo.create({ name, price, category: 'x' });
    }
    expect(repo.list().total).toBe(5);
    expect(repo.list().items.map((p) => p.name)).toEqual(['C', 'A', 'E', 'B', 'D']);
    expect(repo.list({ sortBy: 'price' }).items.map((p) => p.price)).toEqual([9, 10, 30, 40, 100]);
    const page = repo.list({ sortBy: 'name', dir: 'desc', offset: 1, limit: 2 });
    expect(page).toEqual({ total: 5, items: [expect.objectContaining({ name: 'D' }), expect.objectContaining({ name: 'C' })] });
    expect(repo.list({ offset: 10 }).items).toEqual([]);
  });
});

describe('topCustomers', () => {
  const orders: Order[] = [
    { id: '1', customerId: 'bob', total: 100, status: 'paid' },
    { id: '2', customerId: 'ann', total: 50, status: 'paid' },
    { id: '3', customerId: 'ann', total: 50, status: 'paid' },
    { id: '4', customerId: 'cyril', total: 1000, status: 'cancelled' },
    { id: '5', customerId: 'dan', total: 30, status: 'paid' },
    { id: '6', customerId: 'dan', total: 999, status: 'open' },
  ];

  it('sečte jen paid, řadí revenue desc a pak id asc', () => {
    expect(topCustomers(orders, 2)).toEqual([
      { customerId: 'ann', revenue: 100 },
      { customerId: 'bob', revenue: 100 },
    ]);
    expect(topCustomers(orders, 10).map((c) => c.customerId)).toEqual(['ann', 'bob', 'dan']);
    expect(topCustomers([], 3)).toEqual([]);
  });
});

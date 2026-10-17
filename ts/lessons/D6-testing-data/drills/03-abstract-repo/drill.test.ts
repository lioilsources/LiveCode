import { Test } from '@nestjs/testing';
import { InMemoryProductsRepository, Product, ProductsRepository } from './drill';

describe('ProductsRepository jako DI token', () => {
  let repo: ProductsRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: ProductsRepository, useClass: InMemoryProductsRepository }],
    }).compile();
    repo = moduleRef.get(ProductsRepository);
  });

  it('pod tokenem abstraktní třídy dostanu in-memory implementaci', () => {
    expect(repo).toBeInstanceOf(InMemoryProductsRepository);
    expect(repo).toBeInstanceOf(ProductsRepository);
  });

  it('save přidělí id od 1 nahoru', async () => {
    const a: Product = await repo.save({ sku: 'A-1', name: 'Alpha' });
    const b = await repo.save({ sku: 'B-1', name: 'Beta' });
    expect(a).toEqual({ id: 1, sku: 'A-1', name: 'Alpha' });
    expect(b.id).toBe(2);
  });

  it('findById / findAll', async () => {
    await repo.save({ sku: 'A-1', name: 'Alpha' });
    await repo.save({ sku: 'B-1', name: 'Beta' });
    await expect(repo.findById(2)).resolves.toMatchObject({ sku: 'B-1' });
    await expect(repo.findById(99)).resolves.toBeUndefined();
    await expect(repo.findAll()).resolves.toHaveLength(2);
  });

  it('každá instance má vlastní data (žádný sdílený static stav)', async () => {
    await repo.save({ sku: 'A-1', name: 'Alpha' });
    const other = new InMemoryProductsRepository();
    await expect(other.findAll()).resolves.toEqual([]);
  });
});

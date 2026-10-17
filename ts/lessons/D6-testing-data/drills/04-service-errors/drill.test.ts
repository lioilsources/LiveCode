import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ProductsRepository, ProductsService } from './drill';

describe('ProductsService (unit, mock repozitáře)', () => {
  let service: ProductsService;
  let repo: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findBySku: jest.fn(),
      save: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: ProductsRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('getById vrátí produkt z repozitáře', async () => {
    repo.findById.mockResolvedValue({ id: 1, sku: 'A', name: 'Alpha' });
    await expect(service.getById(1)).resolves.toEqual({ id: 1, sku: 'A', name: 'Alpha' });
    expect(repo.findById).toHaveBeenCalledWith(1);
  });

  it('getById neexistujícího → NotFoundException', async () => {
    repo.findById.mockResolvedValue(undefined);
    await expect(service.getById(7)).rejects.toThrow(NotFoundException);
  });

  it('create uloží nový produkt', async () => {
    repo.findBySku.mockResolvedValue(undefined);
    repo.save.mockImplementation(async (d) => ({ id: 10, ...d }));
    await expect(service.create({ sku: 'N', name: 'New' })).resolves.toEqual({ id: 10, sku: 'N', name: 'New' });
    expect(repo.save).toHaveBeenCalledWith({ sku: 'N', name: 'New' });
  });

  it('create s existujícím sku → ConflictException, save se nevolá', async () => {
    repo.findBySku.mockResolvedValue({ id: 1, sku: 'A', name: 'Alpha' });
    await expect(service.create({ sku: 'A', name: 'Dup' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

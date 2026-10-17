import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { InsufficientStockError, OrderNotFoundError, UnknownSkuError } from './errors';
import { InventoryService } from './inventory.service';
import { OrdersService } from './orders.service';

describe('OrdersService (unit, mocked inventory)', () => {
  let service: OrdersService;
  let stock: Record<string, number>;
  const inventory = {
    available: jest.fn((sku: string) => {
      const qty = stock[sku];
      if (qty === undefined) throw new UnknownSkuError(sku);
      return qty;
    }),
    adjust: jest.fn(),
  };

  beforeEach(async () => {
    stock = { A: 10, B: 5 };
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [OrdersService, { provide: InventoryService, useValue: inventory }],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  it('reserves every item', () => {
    const order = service.create({ items: [{ sku: 'A', qty: 3 }, { sku: 'B', qty: 2 }] });
    expect(order.status).toBe('reserved');
    expect(inventory.adjust).toHaveBeenCalledWith('A', -3);
    expect(inventory.adjust).toHaveBeenCalledWith('B', -2);
    expect(service.findOne(order.id)).toEqual(order);
  });

  it('is atomic: one shortage → nothing is adjusted', () => {
    expect(() => service.create({ items: [{ sku: 'A', qty: 3 }, { sku: 'B', qty: 6 }] })).toThrow(
      InsufficientStockError,
    );
    expect(inventory.adjust).not.toHaveBeenCalled();
  });

  it('reports ALL shortages, not just the first', () => {
    try {
      service.create({ items: [{ sku: 'A', qty: 11 }, { sku: 'B', qty: 6 }] });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InsufficientStockError);
      expect((err as InsufficientStockError).shortages).toEqual([
        { sku: 'A', requested: 11, available: 10 },
        { sku: 'B', requested: 6, available: 5 },
      ]);
    }
  });

  it('merges duplicate SKUs before checking stock', () => {
    expect(() => service.create({ items: [{ sku: 'A', qty: 6 }, { sku: 'A', qty: 6 }] })).toThrow(
      InsufficientStockError,
    );
    const order = service.create({ items: [{ sku: 'A', qty: 4 }, { sku: 'A', qty: 5 }] });
    expect(order.items).toEqual([{ sku: 'A', qty: 9 }]);
    expect(inventory.adjust).toHaveBeenCalledTimes(1);
    expect(inventory.adjust).toHaveBeenCalledWith('A', -9);
  });

  it('unknown SKU propagates as UnknownSkuError and adjusts nothing', () => {
    expect(() => service.create({ items: [{ sku: 'A', qty: 1 }, { sku: 'Z', qty: 1 }] })).toThrow(
      UnknownSkuError,
    );
    expect(inventory.adjust).not.toHaveBeenCalled();
  });

  it('cancel returns stock exactly once (idempotent)', () => {
    const order = service.create({ items: [{ sku: 'A', qty: 3 }] });
    inventory.adjust.mockClear();

    expect(service.cancel(order.id).status).toBe('cancelled');
    expect(service.cancel(order.id).status).toBe('cancelled');
    expect(inventory.adjust).toHaveBeenCalledTimes(1);
    expect(inventory.adjust).toHaveBeenCalledWith('A', 3);
  });

  it('findOne / cancel unknown id → OrderNotFoundError', () => {
    expect(() => service.findOne('nope')).toThrow(OrderNotFoundError);
    expect(() => service.cancel('nope')).toThrow(OrderNotFoundError);
  });
});

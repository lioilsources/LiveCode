import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InsufficientStockError, OrderNotFoundError, Shortage } from './errors';
import { InventoryService } from './inventory.service';
import { CreateOrderDto } from './orders.dto';

export interface OrderItem {
  sku: string;
  qty: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: 'reserved' | 'cancelled';
  createdAt: string;
}

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, Order>();

  constructor(private readonly inventory: InventoryService) {}

  create(dto: CreateOrderDto): Order {
    // 1) sloučit duplicitní SKU — [{A,6},{A,6}] je požadavek na 12, ne 2× na 6
    const wanted = new Map<string, number>();
    for (const { sku, qty } of dto.items) {
      wanted.set(sku, (wanted.get(sku) ?? 0) + qty);
    }

    // 2) nejdřív VŠE zkontrolovat (UnknownSkuError probublá sám)...
    const shortages: Shortage[] = [];
    for (const [sku, requested] of wanted) {
      const available = this.inventory.available(sku);
      if (available < requested) shortages.push({ sku, requested, available });
    }
    if (shortages.length > 0) throw new InsufficientStockError(shortages);

    // 3) ...pak teprve měnit. Mezi 2) a 3) není await → nikdo jiný nemůže
    //    sklad změnit. S DB: transakce + SELECT … FOR UPDATE nebo
    //    UPDATE … SET qty = qty - $1 WHERE qty >= $1 a kontrola affected rows.
    for (const [sku, qty] of wanted) {
      this.inventory.adjust(sku, -qty);
    }

    const order: Order = {
      id: randomUUID(),
      items: [...wanted].map(([sku, qty]) => ({ sku, qty })),
      status: 'reserved',
      createdAt: new Date().toISOString(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  findOne(id: string): Order {
    const order = this.orders.get(id);
    if (!order) throw new OrderNotFoundError(id);
    return order;
  }

  /** Idempotentní: druhé zrušení nic nevrací do skladu podruhé. */
  cancel(id: string): Order {
    const order = this.findOne(id);
    if (order.status === 'cancelled') return order;

    for (const { sku, qty } of order.items) {
      this.inventory.adjust(sku, qty);
    }
    const cancelled: Order = { ...order, status: 'cancelled' };
    this.orders.set(id, cancelled);
    return cancelled;
  }
}

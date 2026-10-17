import { Injectable } from '@nestjs/common';
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
  constructor(private readonly inventory: InventoryService) {}

  /** Atomicky rezervuje všechny položky, jinak InsufficientStockError se VŠEMI nedostatky. */
  create(dto: CreateOrderDto): Order {
    throw new Error('TODO');
  }

  /** Neexistuje → OrderNotFoundError. */
  findOne(id: string): Order {
    throw new Error('TODO');
  }

  /** Vrátí zásoby; idempotentní (druhé zrušení nic nevrací). */
  cancel(id: string): Order {
    throw new Error('TODO');
  }
}

import { Controller } from '@nestjs/common';
import { OrdersService } from './orders.service';

// TODO: POST /orders (201), GET /orders/:id, POST /orders/:id/cancel (200)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
}

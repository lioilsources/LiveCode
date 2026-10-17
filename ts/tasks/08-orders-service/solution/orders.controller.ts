import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from './orders.dto';
import { Order, OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto): Order {
    return this.orders.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Order {
    return this.orders.findOne(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK) // POST default je 201, ale nic nevytváříme
  cancel(@Param('id') id: string): Order {
    return this.orders.cancel(id);
  }
}

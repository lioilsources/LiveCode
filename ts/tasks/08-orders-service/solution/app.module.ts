import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './domain-exception.filter';
import { InventoryController } from './inventory.controller';
import { INITIAL_STOCK, InventoryService } from './inventory.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController, InventoryController],
  providers: [
    OrdersService,
    InventoryService,
    { provide: INITIAL_STOCK, useValue: { A: 10, B: 5, C: 0 } },
    // Filtr přes APP_FILTER (ne app.useGlobalFilters) → platí i v testu a má DI.
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}

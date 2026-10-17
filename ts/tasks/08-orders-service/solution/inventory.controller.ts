import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':sku')
  get(@Param('sku') sku: string) {
    return { sku, available: this.inventory.available(sku) };
  }
}

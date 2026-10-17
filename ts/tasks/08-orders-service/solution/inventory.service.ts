import { Inject, Injectable } from '@nestjs/common';
import { UnknownSkuError } from './errors';

export const INITIAL_STOCK = Symbol('INITIAL_STOCK');

/** Hotová služba skladu. Neměň ji — OrdersService ji jen používá. */
@Injectable()
export class InventoryService {
  private readonly stock: Map<string, number>;

  constructor(@Inject(INITIAL_STOCK) initial: Record<string, number>) {
    this.stock = new Map(Object.entries(initial));
  }

  /** Kolik kusů je volných. Neznámé SKU → UnknownSkuError. */
  available(sku: string): number {
    const qty = this.stock.get(sku);
    if (qty === undefined) throw new UnknownSkuError(sku);
    return qty;
  }

  /** Přičte `delta` (záporné = rezervace). Pod nulu nikdy — to je bug volajícího. */
  adjust(sku: string, delta: number): void {
    const next = this.available(sku) + delta;
    if (next < 0) throw new Error(`Invariant violated: stock of ${sku} would be ${next}`);
    this.stock.set(sku, next);
  }
}

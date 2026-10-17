/**
 * Doménové chyby nevědí nic o HTTP. Na status kódy je mapuje až
 * DomainExceptionFilter — service jde pak použít i z CLI, fronty, cronu…
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name; // jinak by name bylo "Error"
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(readonly orderId: string) {
    super(`Order ${orderId} not found`);
  }
}

export class UnknownSkuError extends DomainError {
  constructor(readonly sku: string) {
    super(`Unknown SKU ${sku}`);
  }
}

export interface Shortage {
  sku: string;
  requested: number;
  available: number;
}

export class InsufficientStockError extends DomainError {
  constructor(readonly shortages: Shortage[]) {
    super(`Insufficient stock for ${shortages.map((s) => s.sku).join(', ')}`);
  }
}

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export const PAYMENT_DELAY_MS = Symbol('PAYMENT_DELAY_MS');

export interface CreatePaymentBody {
  amount: number; // v haléřích
  currency: string;
}

export interface Payment extends CreatePaymentBody {
  id: string;
  createdAt: string;
}

/** „Platební brána" — každé zavolání create() = skutečně stržené peníze. */
@Injectable()
export class PaymentsService {
  /** Kolikrát se opravdu platilo (test to kontroluje). */
  calls = 0;

  constructor(@Inject(PAYMENT_DELAY_MS) private readonly delayMs: number) {}

  async create(body: CreatePaymentBody): Promise<Payment> {
    this.calls++;
    await new Promise((r) => setTimeout(r, this.delayMs));
    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }
    return { id: randomUUID(), ...body, createdAt: new Date().toISOString() };
  }
}

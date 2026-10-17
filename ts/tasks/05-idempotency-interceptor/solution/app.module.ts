import { Body, Controller, Module, Post, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyStore } from './idempotency.store';
import { CreatePaymentBody, PAYMENT_DELAY_MS, Payment, PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body() body: CreatePaymentBody): Promise<Payment> {
    return this.payments.create(body);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    IdempotencyStore,
    IdempotencyInterceptor,
    { provide: PAYMENT_DELAY_MS, useValue: 0 },
  ],
})
export class AppModule {}

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainError } from './errors';

// TODO: OrderNotFoundError → 404, InsufficientStockError → 409 (+ shortages v těle),
//       UnknownSkuError → 422. Tělo: { statusCode, error: err.name, message, ... }
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(err: DomainError, host: ArgumentsHost): void {
    throw new Error('TODO');
  }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { DomainError, InsufficientStockError, OrderNotFoundError, UnknownSkuError } from './errors';

interface HttpResponse {
  status(code: number): { json(body: unknown): unknown };
}

@Catch(DomainError) // ostatní chyby (HttpException, bugy) jdou do default filtru
export class DomainExceptionFilter implements ExceptionFilter {
  catch(err: DomainError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<HttpResponse>();
    const status = statusFor(err);
    const body: Record<string, unknown> = { statusCode: status, error: err.name, message: err.message };
    if (err instanceof InsufficientStockError) body.shortages = err.shortages;
    res.status(status).json(body);
  }
}

function statusFor(err: DomainError): number {
  if (err instanceof OrderNotFoundError) return HttpStatus.NOT_FOUND;
  if (err instanceof InsufficientStockError) return HttpStatus.CONFLICT;
  if (err instanceof UnknownSkuError) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.BAD_REQUEST;
}

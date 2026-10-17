import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface Envelope<T> {
  data: T;
  meta: { durationMs: number };
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    const start = performance.now();
    return next
      .handle()
      .pipe(map((data) => ({ data, meta: { durationMs: Math.round(performance.now() - start) } })));
  }
}

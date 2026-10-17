import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

export interface Envelope<T> {
  data: T;
  meta: { durationMs: number };
}

// TODO: úspěšný výsledek handleru → { data, meta: { durationMs } }
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    throw new Error('TODO');
  }
}

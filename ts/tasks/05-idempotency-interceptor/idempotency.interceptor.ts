import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { fingerprint } from './fingerprint';
import { IdempotencyStore } from './idempotency.store';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // TODO:
    //  - bez hlavičky Idempotency-Key → 400
    //  - stejný klíč, jiný fingerprint(body) → 422
    //  - stejný klíč, ještě běží → 409
    //  - stejný klíč, hotovo → vrať uloženou odpověď (+ hlavička Idempotent-Replayed: true)
    //  - nový klíč → označ in_progress, zavolej handler, ulož výsledek; při chybě klíč uvolni
    throw new Error('TODO');
  }
}

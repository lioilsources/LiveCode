import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { fingerprint } from './fingerprint';
import { IdempotencyStore } from './idempotency.store';

interface HttpRequest {
  body: unknown;
  header(name: string): string | undefined;
}
interface HttpResponse {
  setHeader(name: string, value: string): unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<HttpRequest>();
    const res = http.getResponse<HttpResponse>();

    const key = req.header('idempotency-key');
    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    const fp = fingerprint(req.body);

    const existing = this.store.get(key);
    if (existing) {
      if (existing.fingerprint !== fp) {
        throw new UnprocessableEntityException('Idempotency-Key reused with a different body');
      }
      if (existing.state === 'in_progress') {
        throw new ConflictException('A request with this Idempotency-Key is in progress');
      }
      res.setHeader('Idempotent-Replayed', 'true');
      return of(existing.body); // handler se nevolá; status kód doplní Nest (201 pro POST)
    }

    // Get + set bez await mezi nimi = atomické (jedno vlákno). V Redis by to byl SET NX.
    this.store.set(key, { state: 'in_progress', fingerprint: fp });

    return next.handle().pipe(
      tap((body) => this.store.set(key, { state: 'done', fingerprint: fp, body })),
      // Chyba se necachuje — klient může opravit a zkusit znovu se stejným klíčem.
      catchError((err: unknown) => {
        this.store.delete(key);
        return throwError(() => err);
      }),
    );
  }
}

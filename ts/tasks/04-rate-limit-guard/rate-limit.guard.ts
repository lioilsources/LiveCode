import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Clock } from './clock';
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from './rate-limit.options';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly clock: Clock,
    @Inject(RATE_LIMIT_OPTIONS) private readonly opts: RateLimitOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // TODO: token bucket per x-api-key
    //  - chybí klíč → 401
    //  - token je → spotřebuj, true
    //  - není → hlavička Retry-After (celé sekundy, nahoru) + 429
    throw new Error('TODO');
  }
}

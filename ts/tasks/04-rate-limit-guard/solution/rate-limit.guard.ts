import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Clock } from './clock';
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from './rate-limit.options';

// V běžném Nest projektu: `import type { Request, Response } from 'express'`
// (balíček @types/express). Tady stačí to, co opravdu používáme.
interface HttpRequest {
  header(name: string): string | undefined;
}
interface HttpResponse {
  setHeader(name: string, value: number | string): unknown;
}

interface Bucket {
  tokens: number;
  updatedAt: number; // ms
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Guard je singleton → mapa žije po celou dobu aplikace.
  // Produkce: Redis (sdílené mezi instancemi) + TTL na neaktivní klíče.
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly clock: Clock,
    @Inject(RATE_LIMIT_OPTIONS) private readonly opts: RateLimitOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<HttpRequest>();
    const res = http.getResponse<HttpResponse>();

    const key = req.header('x-api-key');
    if (!key) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const now = this.clock.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.opts.capacity, updatedAt: now };

    // Líné doplnění: místo timeru dopočítám, kolik přiteklo od posledního requestu.
    const elapsedSec = (now - bucket.updatedAt) / 1000;
    bucket.tokens = Math.min(this.opts.capacity, bucket.tokens + elapsedSec * this.opts.refillPerSec);
    bucket.updatedAt = now;
    this.buckets.set(key, bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
      return true;
    }

    const retryAfterSec = Math.ceil((1 - bucket.tokens) / this.opts.refillPerSec);
    res.setHeader('Retry-After', retryAfterSec);
    throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}

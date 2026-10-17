import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { Clock, SystemClock } from './clock';
import { RATE_LIMIT_OPTIONS } from './rate-limit.options';
import { RateLimitGuard } from './rate-limit.guard';

@Controller()
export class PingController {
  @Get('ping')
  @UseGuards(RateLimitGuard)
  ping() {
    return { pong: true };
  }

  @Get('health') // bez limitu
  health() {
    return { ok: true };
  }
}

@Module({
  controllers: [PingController],
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: RATE_LIMIT_OPTIONS, useValue: { capacity: 3, refillPerSec: 1 } },
    RateLimitGuard,
  ],
})
export class AppModule {}

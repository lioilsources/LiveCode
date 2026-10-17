import { Injectable } from '@nestjs/common';

/** Abstraktní třída = DI token i typ zároveň (interface za běhu neexistuje). */
export abstract class Clock {
  /** Milisekundy. */
  abstract now(): number;
}

@Injectable()
export class SystemClock extends Clock {
  now(): number {
    return Date.now();
  }
}

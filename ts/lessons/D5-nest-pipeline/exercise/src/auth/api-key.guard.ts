import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from './users';

export type AuthedRequest = Request & { user?: User };

// TODO:
//  - @Public() na handleru nebo controlleru → pusť
//  - hlavička x-api-key → uživatel z API_KEYS (./users), jinak 401
//  - uživatele ulož do req.user
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    throw new Error('TODO');
  }
}

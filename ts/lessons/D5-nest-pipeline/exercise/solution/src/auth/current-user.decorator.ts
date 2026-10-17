import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './api-key.guard';
import type { User } from './users';

export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    return field ? user?.[field] : user;
  },
);

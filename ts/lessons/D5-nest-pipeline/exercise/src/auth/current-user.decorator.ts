import type { User } from './users';

// TODO: param decorator — @CurrentUser() vrátí req.user, @CurrentUser('id') jen pole.
//       (nápověda: createParamDecorator z '@nestjs/common')
export function CurrentUser(field?: keyof User): ParameterDecorator {
  return () => {
    // TODO
  };
}

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AccessDeniedError, NotFoundError } from '../domain/errors';

@Catch(NotFoundError, AccessDeniedError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: NotFoundError | AccessDeniedError, host: ArgumentsHost) {
    const [status, code] = err instanceof NotFoundError ? [404, 'NOT_FOUND'] : [403, 'FORBIDDEN'];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ error: { code, message: err.message } });
  }
}

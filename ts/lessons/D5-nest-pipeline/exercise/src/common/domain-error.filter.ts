import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

// TODO: chytej doménové chyby z ../domain/errors a odpověz jednotným tvarem
//   NotFoundError     → 404 { error: { code: 'NOT_FOUND', message } }
//   AccessDeniedError → 403 { error: { code: 'FORBIDDEN', message } }
// HttpException (např. 401 z guardu) NECHYTEJ.
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    throw new Error('TODO');
  }
}

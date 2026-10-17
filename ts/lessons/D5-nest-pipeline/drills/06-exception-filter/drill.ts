// DRILL 06 — doménové chyby + exception filter
//
// Napiš a exportuj:
//
//  1. NotFoundError extends Error — constructor(entity, id),
//     message "<entity> <id> not found"
//  2. ConflictError extends Error — constructor(message)
//  3. DomainErrorFilter — @Catch(obě chyby), odpoví:
//       NotFoundError → 404 { error: { code: 'NOT_FOUND', message } }
//       ConflictError → 409 { error: { code: 'CONFLICT',  message } }
//  4. UsersService — get(id): id 1 → { id: 1, name: 'olda' }, jinak NotFoundError('user', id);
//                    create(): vždy ConflictError('email taken')
//  5. UsersController (prefix 'users'):
//     - GET  /users/bad-request → throw BadRequestException (filter ji NESMÍ chytit)
//     - GET  /users/:id         → service.get (ParseIntPipe)
//     - POST /users             → service.create
//  6. AppModule — filter jako APP_FILTER
//
// Sval: @Catch(A, B), catch(err, host: ArgumentsHost),
//       host.switchToHttp().getResponse<Response>().status(n).json(...)
//
//   npx jest lessons/D5-nest-pipeline/drills/06

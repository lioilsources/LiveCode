// DRILL 02 — globální guard přes APP_GUARD + @Public()
//
// Napiš a exportuj:
//
//  1. IS_PUBLIC_KEY (string) a dekorátor Public() přes SetMetadata
//  2. ApiKeyGuard (implements CanActivate, dostane Reflector přes DI):
//     - když handler NEBO controller má @Public() → pusť
//     - jinak hlavička x-api-key musí být 'secret', jinak UnauthorizedException (401)
//  3. ReportsController (prefix 'reports'):
//     - GET /reports         → { reports: [] }   (chráněné)
//     - GET /reports/health  → { ok: true }      (@Public na metodě)
//  4. DocsController (prefix 'docs', @Public na TŘÍDĚ):
//     - GET /docs            → { docs: 'here' }
//  5. AppModule — guard registrovaný jako { provide: APP_GUARD, useClass: ApiKeyGuard }
//
// Sval: reflector.getAllAndOverride(KEY, [ctx.getHandler(), ctx.getClass()]),
//       ctx.switchToHttp().getRequest<Request>()
//
//   npx jest lessons/D5-nest-pipeline/drills/02

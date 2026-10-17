// DRILL 01 — controller + module z prázdné stránky
//
// Napiš a exportuj:
//
//  1. HealthController s prefixem 'health':
//     - GET  /health          → { status: 'ok' }
//     - GET  /health/version  → { version: '1.0.0' }
//     - POST /health/ping     → { pong: true } se statusem 200 (default u POST je 201!)
//  2. HealthModule, který controller registruje.
//
// Sval: @Controller('prefix'), @Get('sub'), @HttpCode, @Module({ controllers })
//
//   npx jest lessons/D4-nest-basics/drills/01

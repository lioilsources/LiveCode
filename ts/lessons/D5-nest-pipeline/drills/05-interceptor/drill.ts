// DRILL 05 — interceptory (rxjs: map, tap, timeout, catchError)
//
// Napiš a exportuj:
//
//  1. WrapInterceptor — výsledek handleru obalí do { data }
//     → registruj GLOBÁLNĚ přes APP_INTERCEPTOR
//  2. TimingInterceptor — nastaví hlavičku x-response-time: "<n>ms"
//     → @UseInterceptors na controlleru
//  3. TimeoutInterceptor — po 50 ms RequestTimeoutException (408),
//     ostatní chyby pustí dál beze změny
//     → @UseInterceptors jen na /things/slow
//  4. ThingsController (prefix 'things'):
//     - GET /things          → ['a', 'b']
//     - GET /things/async    → async, po ~5 ms vrátí { id: 1 }
//     - GET /things/slow     → async, po 200 ms vrátí 'late'
//     - GET /things/missing  → throw NotFoundException
//  5. AppModule
//
// Sval: intercept(ctx, next) { /* před */ return next.handle().pipe(/* po */) }
//
//   npx jest lessons/D5-nest-pipeline/drills/05

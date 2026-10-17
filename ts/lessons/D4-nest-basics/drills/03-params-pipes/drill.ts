// DRILL 03 — @Param, @Query, @Headers + built-in pipes (BEZ ValidationPipe)
//
// Napiš a exportuj ItemsController (prefix 'items') a ItemsModule:
//
//  - GET /items/:id          → { id, type: typeof id }  — id musí být number
//                              ("abc" → 400). Použij ParseIntPipe.
//  - GET /items?limit=&q=    → { limit, q }  — limit default 10 (DefaultValuePipe)
//                              a number (ParseIntPipe; "x" → 400), q string
//                              nebo null, když chybí
//  - GET /items/stats        → { count: 0 }   ⚠️ pořadí rout!
//  - GET /items/echo-header  → { requestId }  — hodnota hlavičky x-request-id
//
// Sval: @Param('id', ParseIntPipe), @Query('limit', new DefaultValuePipe(10), ParseIntPipe),
//       @Headers('x-request-id'), statické cesty před ':id'
//
//   npx jest lessons/D4-nest-basics/drills/03

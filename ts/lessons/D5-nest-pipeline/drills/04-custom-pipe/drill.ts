// DRILL 04 — custom pipes
//
// Napiš a exportuj:
//
//  1. ParsePositiveIntPipe implements PipeTransform<string, number>
//     - "42" → 42
//     - "0", "-3", "1.5", "abc", "" → BadRequestException
//       se zprávou "<jméno parametru> must be a positive integer"
//       (jméno je v metadata.data)
//  2. TrimLowerPipe implements PipeTransform<string, string>
//     - "  HeLLo " → "hello"
//  3. OrdersController (prefix 'orders'):
//     - GET /orders/:id      → { id }      (ParsePositiveIntPipe)
//     - GET /orders?status=  → { status }  (TrimLowerPipe)
//  4. AppModule
//
// Sval: transform(value, metadata: ArgumentMetadata), @Param('id', MyPipe)
//
//   npx jest lessons/D5-nest-pipeline/drills/04

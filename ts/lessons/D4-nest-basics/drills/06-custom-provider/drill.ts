// DRILL 06 — custom tokeny: useValue, useClass, useFactory + @Inject
//
// Napiš a exportuj:
//
//  1. interface Greeter { greet(name: string): string }
//  2. tokeny: GREETER a LOUD_GREETER jako Symbol, PREFIX = 'PREFIX' (string)
//  3. PoliteGreeter implements Greeter — prefix dostane přes @Inject(PREFIX),
//     greet('Olda') → "<prefix>, Olda!"
//  4. GreetController (bez prefixu):
//     - GET /greet/:name       → { text } z GREETER
//     - GET /greet-loud/:name  → { text } z LOUD_GREETER
//  5. GreetModule s providery:
//     - PREFIX       useValue 'Hello'
//     - GREETER      useClass PoliteGreeter
//     - LOUD_GREETER useFactory, který dostane GREETER (inject) a vrátí Greeter,
//                    jenž výsledek převede na velká písmena
//
// Test přepisuje PREFIX a GREETER přes overrideProvider — controller tedy
// NESMÍ záviset na PoliteGreeter přímo.
//
// Sval: { provide, useValue | useClass | useFactory, inject }, @Inject(TOKEN)
//
//   npx jest lessons/D4-nest-basics/drills/06

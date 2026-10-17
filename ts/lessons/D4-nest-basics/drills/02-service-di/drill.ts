// DRILL 02 — service + constructor injection
//
// Napiš a exportuj:
//
//  1. CounterService (@Injectable) s privátním číslem (start 0):
//     - get(): number
//     - inc(): number   — zvýší o 1 a vrátí novou hodnotu
//  2. CounterController s prefixem 'counter', service dostane přes konstruktor
//     (parameter property `private readonly ...`):
//     - GET  /counter      → { value }
//     - POST /counter/inc  → { value }   (status 201 je tady v pořádku)
//  3. CounterModule s controllerem i providerem.
//
// Sval: @Injectable(), constructor(private readonly x: X) {}, providers: [X]
//
//   npx jest lessons/D4-nest-basics/drills/02

# Exercise D1 — platební události jako discriminated union

**Čas: 30–40 min.** Typy jsou dané v `payments.ts`, ty píšeš funkce.

Platební brána posílá události. Částky jsou v **haléřích/centech** (celá čísla) —
nikdy nepočítej peníze ve floatech.

## Zadání

1. `describe(e: PaymentEvent): string`
   - `authorized` → `"authorized 12.50 CZK"`
   - `captured` → `"captured 12.50"`
   - `refunded` → `"refunded 5.00 (customer request)"`, bez `reason` jen `"refunded 5.00"`
   - `failed` → `"failed: card_declined"`
   - `switch` na `kind` s `assertNever` v defaultu.

2. `apply(state: PaymentState, e: PaymentEvent): PaymentState` — stavový automat:

   | Stav | Událost | Nový stav |
   |---|---|---|
   | `none` | `authorized` | `authorized { amount, currency }` |
   | `authorized` | `captured` (amount ≤ autorizovaná) | `captured { captured: amount, refunded: 0, currency }` |
   | `captured` | `refunded` (refunded + amount ≤ captured) | `captured` s navýšeným `refunded`; pokud se vrátí vše → `refunded { amount: captured, currency }` |
   | `none` / `authorized` | `failed` | `failed { code }` |
   | cokoli jiného | | `throw new InvalidTransitionError(state.status, e.kind)` |

   Funkce **nesmí mutovat** vstupní stav (vracej nový objekt).

3. `replay(events: PaymentEvent[]): Map<string, PaymentState>` — seskup podle
   `paymentId`, každá platba začíná na `{ status: 'none' }`, události aplikuj v pořadí.

4. `netAmount(state: PaymentState): number` — `captured − refunded` pro `captured`,
   jinak 0 (taky přes switch + `assertNever`).

5. **Bonus:** přidej do `PaymentEvent` variantu `{ kind: 'disputed'; … }` a podívej
   se, kde všude ti kompilátor (`npm run typecheck`) zahlásí chybu. Pak ji vrať.

```bash
npx jest lessons/D1-ts-basics/exercise
```

## Co sleduje interviewer

- Používáš diskriminátor a necháš kompilátor zúžit typ (žádné `as`).
- Exhaustiveness přes `never`.
- Vlastní chybová třída (`extends Error`, nastavené `name`) a `instanceof` v testu.
- Immutabilita (spread `{ ...state, refunded: … }`).

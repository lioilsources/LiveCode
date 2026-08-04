# PROGRESS.md

> Aktualizuje Claude Code po každé lekci. Na začátku session odsud navázat.

## Stav lekcí

| # | Lekce | Stav |
|---|-------|------|
| 1 | Goroutines & channels | 🟡 recap + examples hotové, **čeká: odpověď na kontrolní otázku + exercise** |
| 2 | WaitGroup & context | 🟡 výklad proběhl v chatu, chybí LESSON.md + exercise |
| 3 | Goroutine leaks | ⬜ |
| 4 | Worker pool & bounded parallelism | ⬜ |
| 5 | Pipelines, fan-in/fan-out | ⬜ |
| 6 | Sync primitiva | ⬜ |
| 7 | Timeouts, retry, rate limiting | ⬜ |
| 8 | HTTP služba prakticky | ⬜ |
| 9 | Distribuovaná spolehlivost | ⬜ |
| 10 | Mock interview | ⬜ |

### Track B — typový systém

| # | Lekce | Stav |
|---|-------|------|
| 11 | Interfaces & polymorfismus | 🟡 materiály hotové, **čeká: exercise** |
| 12 | Type assertion & type switch | 🟡 materiály hotové, **čeká: exercise** |
| 13 | Generika | 🟡 materiály hotové, **čeká: exercise** |

## Session log

### 2026-08-01 — Setup + Lekce 1 zahájena

- Vytvořen repozitář (struktura dle plánu, go.mod, go 1.26).
- Lekce 1: `LESSON.md` (recap), 3 examples (handoff, close+range, range-vs-select
  s důkazem leaku přes `runtime.NumGoroutine`), exercise `Producer` + `Sum` s testy.
- Deps (goleak, errgroup, rate) záměrně zatím nepřidány — přidají se v lekcích 3/4/7,
  až budou poprvé potřeba.

### 2026-08-02 — Kontrolní otázka ověřena

- ✅ Mechanismus pochopen: range visí bez close, select má cestu ven přes ctx; fix s `ok` řekl sám.
- ⚠️ **Drhne (zopakovat příště):**
  1. Terminologie **leak vs. deadlock** — visící goroutina ≠ deadlock; deadlock = spí všechny → fatal error.
  2. Mylně: „čtení ze zavřeného channelu spadne" — NE: vrací nulu + ok=false okamžitě
     (worker se roztočí naprázdno). **Panic je až SEND do zavřeného channelu.**
- Example 03 spuštěn jako důkaz (NumGoroutine 3 → 2, rangeWorker leaknutý).
- **Otevřeno: exercise** (`go test -race ./lessons/01-goroutines-channels/exercise/`).

### 2026-08-04 — Track B založen (lekce 11–13)

- Podnět: live coding drhnul na polymorfismu, type assertion, pattern matchingu a generikách.
- Vytvořeno: 3 lekce (LESSON.md + 9 examples + 3 exercises s testy) + `cheatsheet/TYPES_CHEATSHEET.md`.
- Všech 9 examples spuštěno a ověřeno; **cvičení ověřena referenčním řešením** (testy zelené),
  aby zadání nebylo neřešitelné.
- Záměrně: testy lekcí 11 a 13 se **nezkompilují**, dokud se kostra nedoplní —
  hláška kompilátoru (`does not implement`, `possibly missing ~`) je součást výuky.
- **Otevřeno: 3 exercises Tracku B + pořád exercise lekce 1.**

### 2026-08-04 (2) — Drilly na psaní (lekce 11)

- Zpětná vazba: **„číst umím, limituje mě psaní"** → přidán `lessons/11-…/drills/`:
  6 mikro-cvičení z prázdné stránky (interface, polymorfní fn, pointer receiver,
  typed nil, embedding, func adapter). Ověřeno referenčním řešením — 6× ok.
- **Metodika pro další lekce: u psacích slabin nedávat víc výkladu, ale drilly**
  (malé zadání + test, opakovat 2–3× po smazání).
- Otevřeno: projet drilly 01–06, pak teprve exercise lekce 11.

## Otázky k zopakování (spaced repetition)

### Track A
1. Visící goroutina na čtení z nikdy nezavřeného channelu — je to deadlock, nebo leak? Proč?
2. Vyplň tabulku naslepo: receive/send/close × otevřený/zavřený/nil channel. Co panikaří, co blokuje navždy, co vrací hned?
3. Proč channel zavírá producent, a ne consumer?

### Track B
4. Proč `Cat{}` nesplní interface, když má `Speak()` pointer receiver — a co by se pokazilo, kdyby to Go dovolilo?
5. Funkce vrací `error`, uvnitř `var e *MyErr; return e`. Volající testuje `err != nil`. Co se stane a proč?
6. Rozdíl `errors.Is` vs. `errors.As`? Proč nestačí `==` a type assertion?
7. Co dělá `~` v `interface{ ~int | ~float64 }`? Co se pokazí bez ní?
8. Kdy generika a kdy interface? Dej příklad na obojí.

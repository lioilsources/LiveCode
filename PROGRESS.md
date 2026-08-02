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

## Otázky k zopakování (spaced repetition)

1. Visící goroutina na čtení z nikdy nezavřeného channelu — je to deadlock, nebo leak? Proč?
2. Vyplň tabulku naslepo: receive/send/close × otevřený/zavřený/nil channel. Co panikaří, co blokuje navždy, co vrací hned?
3. Proč channel zavírá producent, a ne consumer?

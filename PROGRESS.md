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
- **Otevřeno / příští session začít tady:**
  1. Ověřit odpověď na kontrolní otázku (range vs. select + nuance `j, ok`).
  2. Review exercise (`go test -race ./lessons/01-goroutines-channels/exercise/`).
- Deps (goleak, errgroup, rate) záměrně zatím nepřidány — přidají se v lekcích 3/4/7,
  až budou poprvé potřeba.

## Otázky k zopakování (spaced repetition)

1. **(otevřená, neověřená)** Proč může `for j := range jobs` leaknout a `for { select }`
   ne? Jaká je nuance se čtením po `close`?
2. Proč channel zavírá producent, a ne consumer?
3. Co vrátí čtení ze zavřeného channelu? A co udělá čtení z nil channelu?

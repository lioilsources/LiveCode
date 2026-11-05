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

### Track C — HackerRank

| # | Část | Stav |
|---|------|------|
| C0 | `hackerrank/README.md` — formát testu, strategie, Go pasti | ✅ |
| C1 | `cheatsheet/ALGO_CHEATSHEET.md` — vzory naslepo | ✅ |
| C2 | `hackerrank/drills/` — 8 drillů (I/O, mapa, two pointers, window, prefix, sort, stack, BFS) | 🟡 materiály hotové, **čeká: projet 3×** |
| C3 | `hackerrank/tasks/` — 8 úloh na čas + `solution/` | 🟡 materiály hotové, **čeká: řešit se stopkami** |

### Track D — TypeScript + NestJS (`ts/`, týden před live codingem)

| Den | Lekce | Stav |
|---|---|---|
| D1 | TS pro Go vývojáře | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D2 | Generika, utility types, chyby | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D3 | Async & Node runtime | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D4 | NestJS základy | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D5 | Nest request pipeline | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D6 | Testování & data | 🟡 materiály hotové, **čeká: drilly + exercise** |
| D7 | Mock interview (`ts/tasks/` 8 úloh, `ts/interview/`) | 🟡 materiály hotové, **čeká: řešit se stopkami** |

### Track E — psaní na čas a stručnost (`TRAINING_PLAN.md`, 14 dní od 6. 11.)

| # | Část | Stav |
|---|------|------|
| E1 | `fundamentals/` — 10 drillů na základy (reverse, dedup, two sum, merge…) | 🟡 materiály hotové, **čeká: kolo 1** |
| E2 | `interview/CONCISE_ANSWERS.md` — 12 otázek, odpověď do 30 s | 🟡 materiály hotové, **čeká: trénink nahlas** |
| E3 | Mock 1 (den 7) a Mock 2 (den 14) | ⬜ |

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

### 2026-09-30 — Track C založen (HackerRank screening pro EverPure)

- Podnět: první kolo u EverPure je HackerRank — jiná disciplína než live coding
  (sám, na čas, skryté testy, stdin/stdout, `int32` stuby).
- Vytvořeno: `hackerrank/README.md` (jak test vypadá, strategie na 90 min,
  tabulka Go pastí, checklist), `cheatsheet/ALGO_CHEATSHEET.md`,
  8 drillů (styl lekce 11: prázdný soubor + test, testy hlídají i složitost
  přes 10^6 vstup), 8 úloh ve formátu HackerRanku (zadání EN, constraints,
  sample I/O, kostra, testy jako skryté testy, `solution/` s kopií testů).
- Ověřeno: drilly 8/8 zelené s referenčním řešením (soubory vráceny do prázdna),
  úlohy 8/8 zelené v `solution/`; kostry se kompilují a padají (na rozdíl od
  drillů — zadání úloh má být čitelné bez hlášek kompilátoru).
- Úloha 07 (REST API se stránkováním) a 08 (prázdný `main`, bufferovaný výstup)
  cílí na backendový HackerRank, ne na algoritmy — tam se ztrácí body zbytečně.
- **Doporučený plán do testu:** den 1 cheatsheet + drilly 1×; den 2 drilly 2×
  + úlohy 01–04 se stopkami; den 3 úlohy 05–08; den před testem drilly naslepo,
  nic nového.
- **Otevřeno: drilly C2 (3 kola), úlohy C3.** Track A/B exercises pořád otevřené.

### 2026-10-17 — Track D založen (TypeScript + NestJS)

- Podnět: další live coding u firmy s TS/Node.js jako hlavním backendem; v live
  codingu nejspíš TS + NestJS. Plán: týden, 1 lekce denně (`ts/README.md`).
- Setup `ts/`: Node 22, TypeScript 6, **NestJS 11** (Nest 12 je ESM-only — firmy
  jedou na 10/11), Jest 30 + ts-jest, supertest, class-validator.
- Vytvořeno: 6 lekcí (LESSON.md + examples + 6 drillů + exercise), 8 úloh na čas
  se `solution/`, `ts/interview/THEORY_QA.md` (16 otázek), `GOTCHAS.md` (15 „co to
  vypíše"), `ts/cheatsheet/TS_NEST_CHEATSHEET.md`.
- Ověřeno: drilly a exercises referenčním řešením (pak vráceny do prázdna/kostry),
  všechna `solution/` 150/150 zelená, 16 examples spuštěno, `tsc` čisté mimo
  prázdné drilly.
- Zjištění: Nest examples nejdou přes `tsx` (esbuild neemituje decorator metadata
  → DI injektuje `undefined`) → `npm run ex:nest` (ts-node).
- **Doporučený plán:** D1–D6 po dni (výklad 30 min, drilly 2 kola, exercise);
  D7 úlohy 01 + 02 se stopkami, pak THEORY_QA nahlas. Den před pohovorem:
  cheatsheet sekce 6–9 naslepo, úloha 01 ještě jednou, nic nového.

### 2026-11-03 — Apify live coding

- Ráno 3 h příprava: tabulka channel operací, leak vs. deadlock, TS nalejvárna
  (promise pool, `const`/`let`, `?.`/`??` vs `||`, `===`).
- Na pohovoru úloha „otoč pole" v Go. **Logika indexů správně**
  (`len-1-i`, ověřeno na malých příkladech), ale:
  - syntaxe z Javy/C: `int[]`, `length()`, `for (int i=0; ...)`, `var x :=`, `res[i] := ...`
  - `return numbers` místo `return res`
  - zbytečný speciální případ pro `len == 1`
- Navazující otázky (in-place, složitost) zodpovězeny, ale složitost paměti
  in-place verze řečena jako „N" místo O(1). Čas a paměť se slily dohromady.

### 2026-11-05 — Zpětná vazba Apify + Track E založen

- Feedback: *„passion for building with AI came through… needed more in hands-on
  coding fundamentals, exercise wasn't completed within the time, and in keeping
  answers focused and concise."*
- Vytvořeno: `fundamentals/` (10 drillů, prázdná zadání + testy, ověřeno
  referenčním řešením, které v repu není), `interview/CONCISE_ANSWERS.md`
  (vzorec odpověď, důvod, stop + 12 otázek), `TRAINING_PLAN.md` (14 dní, denní blok
  60 min, mock v den 7 a 14, log).
- **Otevřeno: celý Track E.** Den 1 = pá 6. 11.

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

### Track C
9. Constraints říkají `n ≤ 10^5`. Jakou složitost cílíš a proč je `O(n²)` mimo?
10. `arr []int32`, hodnoty až `2^31-1`, počítáš `arr[i] + k`. Co se stane a jak to napíšeš správně?
11. Proč `for k := range m` nemůže rovnou tisknout výstup? Co uděláš místo toho?
12. Napiš zpaměti I/O kostru: čtení `n` čísel ze stdin + bufferovaný výstup. Co se stane bez `Flush()`?
13. Stránkované API vrací `total_pages: 0`. Co udělá tvůj cyklus?

### Track D
14. Proč projde `const u: UserId = new OrderId('x')` a jak tomu zabráníš (branded type)?
15. Proč se DTO v Nestu píše jako `class`, ne `interface`? Co se stane, když klient pošle `{ "age": "abc" }`?
16. `[10, 1, 5, 100].sort()` — co vrátí a co udělá s polem? Napiš řazení podle `score` desc, pak `name` asc, bez mutace.
17. `await Promise.all(urls.map(u => fetch(u)))`, třetí fetch selže. Co je s ostatními a jak docílit `errgroup.WithContext`?
18. Proč `next++` v `mapWithConcurrency` nepotřebuje mutex? Kde v Node race condition vzniknout může?
19. Co vypíše `setTimeout(A,0); Promise.resolve().then(B); (async()=>{C; await null; D})(); E`?
20. Proč DI nefunguje s parametrem typu `interface`? Co místo toho (abstract class / Symbol + `@Inject`)?
21. `@Param('id') id: number` a `map.get(id)` vrací vždy `undefined`. Proč? Dvě opravy.
22. Nakresli M → G → I → P → H → I → F. Kde vzniká 401 a kde 403? Proč je `APP_GUARD` lepší než `useGlobalGuards(new X())`?
23. E2E test pustí nevalidní email jako 201, produkce vrací 400. Příčina a trvalá oprava?

### Track E
24. Otočení pole do nového slice: čas? paměť? A na místě? Řekni to dvěma větami.
25. Proč je in-place reverse O(n), když udělá jen n/2 kroků?
26. Odpověz do 30 s: „Jak omezíš počet souběžných goroutin?" Byla první věta odpověď?

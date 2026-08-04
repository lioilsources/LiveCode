# GO_INTERVIEW_PLAN.md — Příprava na Go live coding pohovory

> **Instrukce pro Claude Code:** Tento soubor je zadání i studijní plán. Postupuj po lekcích, generuj obsah do struktury níže, každou lekci ukonči cvičením s testy. Cílový student: zkušený Go vývojář (služby, infrastruktura), který se concurrency primitiva učí od základů — vysvětluj česky, kód a identifikátory anglicky. Netlač na tempo: jedna lekce = jedna session.

## Kontext

Plán cílí na témata, kde Go pohovory nejčastěji bolí — typické mezery kandidátů, kteří přicházejí ze služeb a infrastruktury:

1. **Q1 (concurrency):** in-process concurrency — worker pool, bounded parallelism, goroutine leaks, errgroup. Častá past: utéct v odpovědi k infrastrukturnímu škálování (Kubernetes autoscaling) místo concurrency uvnitř procesu.
2. **Q2 (context):** nejen timeouty — cancellation propagation, strom contextů, context values (co tam patří a co ne).
3. **Q3 (distribuovaná spolehlivost):** retry + backoff + jitter, idempotency keys, circuit breaker, at-least-once + dedup, outbox pattern, saga.

**Co už bylo probráno (nezačínej znovu, jen krátce zopakuj):**
- Goroutiny, unbuffered/buffered channely, blokující send/receive, deadlock ("předání z ruky do ruky"), `close` + `range`, pravidlo "zavírá producent", základ `select`.
- `sync.WaitGroup` (Add před `go`, Done přes defer), `context` základy (WithTimeout, defer cancel, ctx.Done() jako nouzový východ, strom contextů, kaskádové rušení).
- Otevřená kontrolní otázka: proč `for { select { case j := <-jobs: ...; case <-ctx.Done(): return } }` je správně vs. `for j := range jobs` — **začni první session ověřením odpovědi na tuto otázku.** (Odpověď: range leakuje, pokud producent nikdy nezavře channel a context je zrušen; select dává druhou cestu ven. Doplň i nuanci: po `close(jobs)` vrací `<-jobs` nulové hodnoty — správně je `case j, ok := <-jobs: if !ok { return }`.)

## Struktura repozitáře

```
go-interview-prep/
├── GO_INTERVIEW_PLAN.md      # tento soubor
├── PROGRESS.md               # Claude Code aktualizuje po každé lekci
├── go.mod
├── lessons/
│   ├── 01-goroutines-channels/
│   │   ├── LESSON.md         # výklad česky
│   │   ├── examples/         # spustitelné main.go ukázky
│   │   └── exercise/         # zadání + kostra + *_test.go
│   ├── 02-waitgroup-context/
│   └── ...
├── interview/
│   ├── THEORY_QA.md          # otázky a vzorové odpovědi na ústní část
│   ├── GOTCHAS.md            # záludné mini-programy "co to vypíše?"
│   └── tasks/                # live-coding úlohy na čas
└── cheatsheet/
    └── CHEATSHEET.md         # vzory naslepo: worker pool, pipeline, semafor…
```

## Osnova lekcí

Každá lekce: LESSON.md (výklad + analogie) → 2–3 examples → 1 exercise s testy → 3 kontrolní otázky do PROGRESS.md.

Plán má **dva tracky**, které jdou studovat nezávisle:
- **Track A — concurrency** (lekce 1–10)
- **Track B — typový systém** (lekce 11–13): polymorfismus, type assertion, pattern matching, generika

### Track A — concurrency

| # | Lekce | Obsah | Stav |
|---|-------|-------|------|
| 1 | Goroutines & channels | goroutiny, un/buffered, close, range, select, deadlocky | ✅ probráno v chatu — jen recap + exercise |
| 2 | WaitGroup & context | WaitGroup pravidla, context strom, Done(), propagace, context values (co tam patří a co ne) | 🟡 výklad hotov, chybí exercise |
| 3 | Goroutine leaks | 3 klasické příčiny (blokovaný send, nezavřený range, chybějící cancel), detekce přes `goleak`, `runtime.NumGoroutine` | ⬜ |
| 4 | Worker pool & bounded parallelism | ruční pool, semafor přes buffered channel, `errgroup` + `SetLimit`, srovnání s WaitGroup | ⬜ |
| 5 | Pipelines, fan-in/fan-out | generator pattern, merge channelů, cancellation v pipeline | ⬜ |
| 6 | Sync primitiva | Mutex vs RWMutex vs channel (kdy co), `sync.Once`, atomic, race detector `go test -race` | ⬜ |
| 7 | Timeouts, retry, rate limiting | `time.After` vs `time.Ticker` (leak u After ve smyčce!), exponential backoff + jitter, `golang.org/x/time/rate` | ⬜ |
| 8 | HTTP služba prakticky | server s graceful shutdown, per-request context, middleware, propagace timeoutů na odchozí volání | ⬜ |
| 9 | Distribuovaná spolehlivost (teorie k Q3) | idempotency keys, circuit breaker, at-least-once + dedup, outbox, saga — s mini-implementacemi (in-memory) | ⬜ |
| 10 | Mock interview | 2 úlohy na čas + ústní otázky, review jako interviewer | ⬜ |

### Track B — typový systém

Polymorfismus v Go funguje jinak než v Javě/C# a je to častý zdroj ztráty bodů na
live codingu. Lekce cílí přesně na to, co se ptá: method sets, typed nil, `errors.Is/As`,
a rozhodnutí *generika vs. interface*.

| # | Lekce | Obsah | Stav |
|---|-------|-------|------|
| 11 | Interfaces & polymorfismus | implicitní splnění, malé interfaces, interface na straně konzumenta, **method sets** (pointer vs. value receiver), interface jako pár (typ, hodnota) → **typed nil**, embedding jako composition | ✅ |
| 12 | Type assertion & type switch | comma-ok vs. panika, assertion na interface (capability detection), type switch a jeho pasti (víc typů ve větvi, pořadí, chybějící kontrola úplnosti), **`errors.Is` / `errors.As`** + wrapping přes `%w`, sealed interface | ✅ |
| 13 | Generika | type params a inference, constraints (`comparable`, `cmp.Ordered`, unions, **vlnovka `~`**), generické typy, `var zero T`, metody bez type params, **generika vs. interfaces**, limity (kovariance), `slices`/`maps`/`cmp` | ✅ |

Rychlé opáčko k Tracku B: `cheatsheet/TYPES_CHEATSHEET.md`.

## Live-coding úlohy (interview/tasks/)

Generuj postupně, řazeno podle pravděpodobnosti na pohovoru. Každá úloha: README se zadáním, kostra, testy, časový limit, vzorové řešení v `solution/` (uživatel se dívá až po pokusu).

1. **Worker pool** — zpracuj N jobů max K workery, posbírej výsledky, ukonči se při zrušení contextu. (15 min)
2. **Merge channels (fan-in)** — sluč M channelů do jednoho, zavři výstup, až skončí všechny vstupy. (10 min)
3. **Parallel fetch s first-error** — stáhni N URL paralelně, při první chybě zruš zbytek (errgroup). (15 min)
4. **Rate limiter** — max N operací za sekundu, token bucket přes ticker/kanál. (15 min)
5. **Pipeline s timeoutem** — generator → transform → sink, celé zrušitelné, žádný leak. (20 min)
6. **Concurrent-safe cache** — mapa s RWMutex + TTL expirace na pozadí; bonus: singleflight na cache miss. (20 min)
7. **Graceful shutdown HTTP serveru** — SIGTERM → přestaň přijímat, dokonči běžící requesty s deadlinem. (15 min)
8. **Retry s backoff** — generická funkce `Retry(ctx, attempts, fn)` s exponential backoff + jitter, respektuje ctx. (10 min)

## Gotchas kvíz (interview/GOTCHAS.md)

Mini-programy "co to vypíše / spadne to?": deadlock na unbuffered send (✅ už umí), plný buffer (✅), loop variable capture (pre-1.22 vs 1.22+), `Add` uvnitř goroutiny, čtení ze zavřeného vs. nil channelu, send do zavřeného channelu (panic!), `time.After` leak ve smyčce, zapomenutý `cancel()`, map bez zámku (race), `WaitGroup` předaná hodnotou.

## Theory Q&A (interview/THEORY_QA.md)

Napiš screeningové otázky Q1–Q8 (typické pro technický screening na Go pozici) a vzorové odpovědi tak, jak je říct nahlas — strukturovaně, česky s anglickými termíny. Zvláštní důraz na Q1 a Q3. Přidej "věty na pohovor" (jednovětá shrnutí seniority), např.: *"Každá goroutina musí mít garantovanou cestu k ukončení."* / *"Exactly-once neexistuje — dělám at-least-once s idempotentním consumerem."*

## Workflow pro Claude Code

1. Na začátku session přečti `PROGRESS.md`, navaž tam, kde se skončilo.
2. Vyklad → example (spusť ho, ukaž výstup) → exercise (uživatel řeší sám, ty jen review přes `go test -race ./...`).
3. Review dělej jako interviewer: nejdřív se ptej ("proč tady buffered channel?"), pak teprve ukazuj řešení.
4. Po lekci aktualizuj `PROGRESS.md` (datum, co šlo, co drhne, otázky k zopakování) a commitni: `git add -A && git commit -m "lesson NN: <topic>"`.
5. Spaced repetition: na začátku každé lekce polož 2 otázky z předchozích lekcí.

## Setup (první spuštění)

```bash
mkdir go-interview-prep && cd go-interview-prep
git init
go mod init github.com/lioilsources/go-interview-prep
# zkopíruj sem tento soubor, vytvoř PROGRESS.md a strukturu adresářů
# volitelně: go get go.uber.org/goleak golang.org/x/sync/errgroup golang.org/x/time/rate
gh repo create go-interview-prep --private --source=. --push
```

# Úlohy na čas — formát HackerRanku

Každá úloha má zadání anglicky (jak ho uvidíš), constraints, sample I/O,
kostru s podpisem funkce a testy psané jako skryté testy HackerRanku
(hraniční případy + jeden velký vstup na timeout). Vzorové řešení je
v `solution/` — **otevři až po vlastním pokusu**, i neúspěšném.

## Jak na to

1. Nastav stopky na limit úlohy. Přečti constraints dřív než sample.
2. Piš do `task.go` (u 08 do `main.go`). Testy pouštěj průběžně, ne až na konci.
3. Když čas vyprší, zapiš si do PROGRESS.md, kde ses zasekl, a **pak** otevři `solution/`.
4. Za pár dní úlohu smaž a napiš znovu.

```bash
go test ./hackerrank/tasks/01-pairs-with-diff/            # tvoje řešení
go test ./hackerrank/tasks/01-pairs-with-diff/solution/   # referenční (má projít vždy)
```

## Pořadí (podle pravděpodobnosti výskytu a obtížnosti)

| # | Úloha | Vzor | Obtížnost | Limit |
|---|-------|------|-----------|-------|
| 01 | `01-pairs-with-diff` | hash set, `int32` přetečení | Easy | 15 min |
| 02 | `02-longest-unique-substring` | sliding window, runy | Medium | 15 min |
| 03 | `03-top-k-words` | mapa + `sort.Slice` s víc klíči | Medium | 15 min |
| 04 | `04-merge-intervals` | sort + průchod | Medium | 15 min |
| 05 | `05-count-islands` | BFS na mřížce | Medium | 20 min |
| 06 | `06-min-coins` | 1D DP | Medium | 20 min |
| 07 | `07-rest-api-pagination` | HTTP + JSON + stránkování | backend „REST API" | 20 min |
| 08 | `08-full-program-range-sums` | I/O kostra + prefix sums | Easy, prázdný `main` | 15 min |

Úlohy 07 a 08 nejsou „algoritmické", ale na backendovém HackerRanku bývají
téměř vždy — a stojí body zbytečně, když nemáš kostru v prstech.

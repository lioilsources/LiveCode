# Drills — algoritmické vzory do prstů

> Stejná metodika jako drilly v lekci 11: **na psaní, ne na pochopení**. Každý
> drill je jeden vzor z `cheatsheet/ALGO_CHEATSHEET.md`, píše se z prázdné
> stránky a má test. Cíl: na HackerRanku neztrácet minuty nad syntaxí
> `sort.Slice` nebo frontou pro BFS.

## Jak drilovat

1. Otevři `drill.go` — je **prázdný** (jen `package drill` a zadání v komentáři).
2. Napiš řešení **bez koukání** do cheatsheetu.
3. Spusť test. Zelená → další.
4. Po všech osmi **smaž obsah a projeď je znovu**. Třetí kolo se stopkami:
   cíl je každý drill do 3 minut, BFS do 5.

```bash
go test ./hackerrank/drills/01-read-ints/
go test ./hackerrank/drills/...
```

## Pořadí

| # | Drill | Sval | Cíl |
|---|-------|------|-----|
| 01 | `01-read-ints` | `bufio.Scanner` + `ScanWords` + `Atoi` | 3 min |
| 02 | `02-count-freq` | mapa jako čítač, tie-break | 3 min |
| 03 | `03-two-pointers` | dva ukazatele na seřazeném poli | 3 min |
| 04 | `04-sliding-window` | okno pevné šířky, add/remove | 3 min |
| 05 | `05-prefix-sums` | `pre[i+1] = pre[i] + a[i]`, dotaz O(1) | 3 min |
| 06 | `06-sort-multikey` | `sort.Slice` se dvěma klíči + kopie | 4 min |
| 07 | `07-stack` | push/peek/pop na slice | 3 min |
| 08 | `08-bfs-grid` | fronta, 4 směry, hranice, dist | 5 min |

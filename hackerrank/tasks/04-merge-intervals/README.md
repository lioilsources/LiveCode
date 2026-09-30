# Task 04 — Merge intervals

**Časový limit: 15 minut** · HackerRank *Medium* · vzor: sort + jeden průchod

## Zadání

Given a list of closed intervals `[start, end]`, merge all overlapping or
touching intervals and return the result sorted by `start`.

```go
func MergeIntervals(intervals [][2]int) [][2]int
```

### Constraints

- `0 ≤ len(intervals) ≤ 10^5`
- `-10^9 ≤ start ≤ end ≤ 10^9`
- Input is **not** sorted.

### Sample Input

```
4
1 3
8 10
2 6
15 18
```

### Sample Output

```
1 6
8 10
15 18
```

### Explanation

`[1,3]` and `[2,6]` overlap, so they become `[1,6]`.

## Na co si dát pozor

- Nejdřív seřaď podle `start`. Pak drž „aktuální" interval a buď ho prodluž
  (`end = max(end, cur.end)`), nebo ho odlož do výsledku a začni nový.
- „Touching" = `[1,3]` a `[3,5]` se slučují na `[1,5]`. Podmínka je `next.start <= cur.end`.
- Vnořený interval `[1,10]`, `[2,3]` — `end` se **nesmí zmenšit**.

```bash
go test ./hackerrank/tasks/04-merge-intervals/
```

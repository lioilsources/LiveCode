# Task 05 — Number of islands

**Časový limit: 20 minut** · HackerRank *Medium* · vzor: BFS/DFS na mřížce

## Zadání

Given an `R × C` grid of characters where `'1'` is land and `'0'` is water,
count the number of islands. An island is a maximal group of land cells
connected **horizontally or vertically** (not diagonally).

```go
func CountIslands(grid [][]byte) int
```

### Constraints

- `0 ≤ R, C ≤ 1000`
- `grid[i][j]` is `'0'` or `'1'`

### Sample Input

```
4 5
11000
11000
00100
00011
```

### Sample Output

```
3
```

## Na co si dát pozor

- Pro každou nenavštívenou `'1'` spusť BFS, označ celou komponentu, přičti 1.
- Označovat můžeš přímo do gridu (`'1'` → `'0'`) — ušetří ti to `visited`.
  Když zadání zakazuje mutaci, měj `[][]bool`.
- Mřížka 1000×1000 = 10^6 buněk. Rekurzivní DFS v Go nespadne (zásobník roste),
  ale iterativní BFS s frontou je stejně dlouhý a bez rizika — nauč se ten.
- Hranice kontroluj **před** přístupem `grid[nr][nc]`.

```bash
go test ./hackerrank/tasks/05-count-islands/
```

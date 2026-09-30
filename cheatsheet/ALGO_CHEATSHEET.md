# Cheatsheet — algoritmické vzory pro HackerRank (Track C)

Vzory, které máš umět naslepo. Každý odpovídá jednomu drillu v `hackerrank/drills/`.
Psáno tak, aby to prošlo i na starší verzi Go (bez `slices`, bez `for i := range n`).

## 0. I/O kostra (režim „celý program")

```go
package main

import (
	"bufio"
	"os"
	"strconv"
)

func main() {
	in := bufio.NewScanner(os.Stdin)
	in.Buffer(make([]byte, 1<<20), 1<<20) // dlouhé řádky; Scanner má default 64 KB
	in.Split(bufio.ScanWords)             // token po tokenu, řádky nás nezajímají

	out := bufio.NewWriter(os.Stdout)
	defer out.Flush() // ⚠️ bez Flush je výstup prázdný

	next := func() int { in.Scan(); v, _ := strconv.Atoi(in.Text()); return v }

	n := next()
	arr := make([]int, n)
	for i := 0; i < n; i++ {
		arr[i] = next()
	}

	out.WriteString(strconv.Itoa(len(arr)))
	out.WriteByte('\n')
}
```

- Čtení řetězců po řádcích (mezery uvnitř): `in.Split(bufio.ScanLines)` + `strings.TrimSpace(in.Text())`.
- Debug: `fmt.Fprintln(os.Stderr, "x =", x)` — **nikdy** na stdout.
- Výstup mnoha čísel: `fmt.Fprintf(out, "%d\n", v)` do bufferovaného `out`, ne `fmt.Println`.

## 1. Čísla a přetečení

```go
var sum int64
for _, v := range arr { sum += int64(v) } // arr je []int32 → sčítej v int64

const inf = int(1e18)                     // „nekonečno" pro int
func abs(x int) int { if x < 0 { return -x }; return x }
func min(a, b int) int { if a < b { return a }; return b } // na starém Go není builtin
func gcd(a, b int) int { for b != 0 { a, b = b, a%b }; return a }
```

## 2. Řetězce

```go
s[i]            // byte, porovnávej s 'a', ne "a"
[]rune(s)       // Unicode: len([]rune("čočka")) == 5, len("čočka") == 7
[]byte(s)       // mutovatelná kopie; string(b) zpátky
strings.Fields(s)          // split na whitespace, bez prázdných tokenů
strings.ToLower(s)
strings.Builder             // skládání výstupu: sb.WriteString(x); sb.String()
strconv.Itoa(n) / strconv.Atoi(s)
// anagram klíč: seřaď runy
r := []rune(w); sort.Slice(r, func(i, j int) bool { return r[i] < r[j] }); key := string(r)
```

## 3. Mapa — počítání a deterministický výstup

```go
cnt := map[string]int{}
for _, w := range words { cnt[w]++ }        // chybějící klíč = 0, žádný check

keys := make([]string, 0, len(cnt))          // ⚠️ range přes mapu má náhodné pořadí
for k := range cnt { keys = append(keys, k) }
sort.Strings(keys)

seen := map[int]bool{}                        // set
if seen[x] { ... }; seen[x] = true
```

## 4. Řazení s víc klíči

```go
sort.Ints(a); sort.Strings(s)
sort.Slice(ps, func(i, j int) bool {          // ⚠️ řadí IN PLACE
	if ps[i].Score != ps[j].Score {
		return ps[i].Score > ps[j].Score      // primárně: skóre sestupně
	}
	return ps[i].Name < ps[j].Name            // sekundárně: jméno vzestupně
})
cp := append([]Player(nil), ps...)            // kopie, když vstup nesmíš mutovat
// Go ≥ 1.21: slices.SortFunc(ps, func(a, b Player) int { return cmp.Compare(...) })
```

## 5. Two pointers (seřazené pole)

```go
i, j := 0, len(a)-1
for i < j {
	s := a[i] + a[j]
	switch {
	case s == target: return true
	case s < target:  i++
	default:          j--
	}
}
```

## 6. Sliding window (pevná šířka k)

```go
if k > len(a) { return 0 }
cur := 0
for i := 0; i < k; i++ { cur += a[i] }
best := cur
for i := k; i < len(a); i++ {
	cur += a[i] - a[i-k]                      // jeden vstoupí, jeden odejde
	if cur > best { best = cur }
}
```

Proměnná šířka (nejdelší bez opakování): pravý ukazatel roste vždy, levý jen
když okno porušuje podmínku — `last[c]` = poslední index znaku.

## 7. Prefix sums (dotazy na součet intervalu v O(1))

```go
pre := make([]int, len(a)+1)                  // pre[i] = součet a[0..i-1]
for i, v := range a { pre[i+1] = pre[i] + v }
sum := pre[r+1] - pre[l]                      // inclusive [l, r], 0-based
```

## 8. Zásobník

```go
stack := []byte{}
stack = append(stack, c)                      // push
top := stack[len(stack)-1]                    // peek
stack = stack[:len(stack)-1]                  // pop (⚠️ nejdřív check len > 0)
pairs := map[byte]byte{')': '(', ']': '[', '}': '{'}
```

## 9. Binary search

```go
i := sort.SearchInts(a, x)                    // první index s a[i] >= x
i := sort.Search(n, func(i int) bool { return pred(i) }) // první i, kde pred true
// „binary search na odpovědi": monotónní predikát „dá se to s hodnotou v?"
lo, hi := 0, maxV
for lo < hi { mid := (lo + hi) / 2; if ok(mid) { hi = mid } else { lo = mid + 1 } }
```

## 10. BFS na mřížce (nejkratší cesta, počet komponent)

```go
type pt struct{ r, c int }
dr := []int{-1, 1, 0, 0}
dc := []int{0, 0, -1, 1}

dist := make([][]int, R)
for i := range dist { dist[i] = make([]int, C); for j := range dist[i] { dist[i][j] = -1 } }

queue := []pt{start}
dist[start.r][start.c] = 0
for len(queue) > 0 {
	p := queue[0]; queue = queue[1:]           // vlastní fronta = žádná rekurze
	for d := 0; d < 4; d++ {
		nr, nc := p.r+dr[d], p.c+dc[d]
		if nr < 0 || nr >= R || nc < 0 || nc >= C { continue }
		if grid[nr][nc] == '#' || dist[nr][nc] != -1 { continue }
		dist[nr][nc] = dist[p.r][p.c] + 1
		queue = append(queue, pt{nr, nc})
	}
}
```

Počet ostrovů = pro každou nenavštívenou '1' spusť BFS a přičti 1.

## 11. DP (1D)

```go
// min. počet mincí na amount; dp[x] = min přes mince c: dp[x-c] + 1
dp := make([]int, amount+1)
for i := 1; i <= amount; i++ { dp[i] = inf }
for x := 1; x <= amount; x++ {
	for _, c := range coins {
		if c <= x && dp[x-c]+1 < dp[x] { dp[x] = dp[x-c] + 1 }
	}
}
// dp[amount] == inf → -1

// Kadane: max součet souvislého podpole
best, cur := a[0], a[0]
for _, v := range a[1:] { cur = max(v, cur+v); best = max(best, cur) }
```

## 12. REST API se stránkováním (backend úlohy)

```go
type page struct {
	Page       int    `json:"page"`
	TotalPages int    `json:"total_pages"`
	Data       []struct {
		Team1      string `json:"team1"`
		Team1Goals string `json:"team1goals"` // ⚠️ jsonmock vrací čísla jako STRINGY
	} `json:"data"`
}

for p := 1; ; p++ {
	url := fmt.Sprintf("%s/api/football_matches?year=%d&team1=%s&page=%d", base, year, url.QueryEscape(team), p)
	resp, err := http.Get(url)
	if err != nil { return 0, err }
	if resp.StatusCode != 200 { resp.Body.Close(); return 0, fmt.Errorf("status %d", resp.StatusCode) }
	var pg page
	err = json.NewDecoder(resp.Body).Decode(&pg)
	resp.Body.Close()                          // ⚠️ ne defer v cyklu
	if err != nil { return 0, err }
	for _, m := range pg.Data { g, _ := strconv.Atoi(m.Team1Goals); total += g }
	if p >= pg.TotalPages { break }
}
```

## 13. Rozhodovací tabulka „co použít"

| Vidím v zadání | Sáhnu po |
|---|---|
| „počet dvojic", „existuje pár" | hash mapa / set; seřazené pole → two pointers |
| „nejdelší/nejkratší podřetězec/podpole s vlastností" | sliding window |
| „součet na intervalu", mnoho dotazů | prefix sums |
| „top K", „seřaď podle … a pak podle …" | mapa + `sort.Slice` s víc klíči |
| závorky, „poslední otevřený", undo | zásobník |
| mřížka, „nejkratší cesta", „ostrovy", „sousedé" | BFS s frontou |
| „minimální počet …", „počet způsobů …", volby se překrývají | DP |
| „nejmenší hodnota, pro kterou to jde" | binary search na odpovědi |
| „v seřazeném poli najdi" | `sort.Search*` |

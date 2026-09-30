# Task 08 — Range sums (celý program, stdin → stdout)

**Časový limit: 15 minut** · HackerRank *Easy*, ale v režimu **prázdný `main`** · vzor: I/O kostra + prefix sums

Tahle úloha je algoritmicky triviální. Cvičí to, co na HackerRanku bolí nejvíc,
když dostaneš prázdný `main`: rychle **přečíst velký vstup, spočítat, vypsat
bufferovaně, flushnout**.

## Zadání

The first line contains an integer `N`. The second line contains `N` integers
`a_1 … a_N`. The third line contains an integer `Q`. Each of the next `Q` lines
contains two integers `l r` (`1 ≤ l ≤ r ≤ N`). For each query print the sum
`a_l + … + a_r` on its own line.

### Constraints

- `1 ≤ N, Q ≤ 2·10^5`
- `-10^9 ≤ a_i ≤ 10^9`

### Sample Input

```
5
1 2 3 4 5
3
1 5
2 3
4 4
```

### Sample Output

```
15
5
4
```

## Jak je to tady postavené

`main.go` má `func main()`, které volá `Run(os.Stdin, os.Stdout)`. Test volá
`Run` se `strings.Reader` a `bytes.Buffer` — na HackerRanku bys to napsal rovnou
do `main`, ale oddělit logiku od `os.Stdin` je zvyk, který se hodí i jinde.

```bash
go test ./hackerrank/tasks/08-full-program-range-sums/
go run ./hackerrank/tasks/08-full-program-range-sums/ < hackerrank/tasks/08-full-program-range-sums/input.txt
```

## Na co si dát pozor

- `2·10^5` čísel do `10^9` → součet až `2·10^14`. `int` je v Go 64bitový, tady OK;
  na HackerRanku by stub dal `[]int32` a tam by to spadlo.
- `fmt.Scan` / `fmt.Println` po jednom na 2·10^5 řádcích = timeout. Scanner na
  vstup, `bufio.Writer` na výstup, **Flush**. Test počítá zápisy do výstupu —
  bez bufferu neprojde.
- Indexy jsou 1-based v zadání, 0-based v poli. Rozhodni se hned na začátku.

```bash
go test ./hackerrank/tasks/08-full-program-range-sums/
```

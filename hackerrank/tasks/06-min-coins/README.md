# Task 06 — Minimum number of coins

**Časový limit: 20 minut** · HackerRank *Medium* · vzor: 1D dynamické programování

## Zadání

You are given coin denominations `coins` and a target `amount`. Return the
**minimum number of coins** needed to make exactly `amount`. You have an
unlimited supply of each coin. If it is impossible, return `-1`.

```go
func MinCoins(coins []int, amount int) int
```

### Constraints

- `1 ≤ len(coins) ≤ 50`, `1 ≤ coins[i] ≤ 10^4`
- `0 ≤ amount ≤ 10^5`

### Sample Input

```
3 11
1 2 5
```

### Sample Output

```
3
```

### Explanation

`11 = 5 + 5 + 1`.

## Na co si dát pozor

- Greedy (největší mince napřed) **nefunguje**: `coins = [1, 3, 4]`, `amount = 6`
  → greedy dá `4+1+1 = 3` mince, správně je `3+3 = 2`.
- `dp[x]` = min. počet mincí na částku `x`. `dp[0] = 0`, ostatní „nekonečno".
  `dp[x] = min(dp[x-c] + 1)` přes mince `c ≤ x`. Odpověď `dp[amount]`, nebo `-1`.
- Složitost `O(amount × len(coins))` = 5·10^6 — v pohodě.
- „Nekonečno" nikdy nesčítej bez kontroly, `inf + 1` může přetéct.

```bash
go test ./hackerrank/tasks/06-min-coins/
```

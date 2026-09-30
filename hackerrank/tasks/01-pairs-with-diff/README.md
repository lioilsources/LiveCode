# Task 01 — Pairs with difference k

**Časový limit: 15 minut** · HackerRank *Easy* · vzor: hash set

## Zadání (ve stylu HackerRanku)

You are given an array of `n` **distinct** integers and a positive integer `k`.
Count the number of pairs `(a, b)` of elements from the array such that `a - b = k`.

Complete the function

```go
func CountPairs(arr []int32, k int32) int32
```

### Constraints

- `2 ≤ n ≤ 10^5`
- `-2^31 ≤ arr[i] ≤ 2^31 - 1`, all values distinct
- `1 ≤ k ≤ 2^31 - 1`

### Sample Input

```
5 2
1 5 3 4 2
```

### Sample Output

```
3
```

### Explanation

Pairs with difference 2: `(3, 1)`, `(4, 2)`, `(5, 3)`.

## Na co si dát pozor

- Constraints říkají `n ≤ 10^5` → `O(n²)` je 10^10 operací, timeout. Cíl je `O(n)`.
- Hodnoty jdou až k hranici `int32`. `x + k` v `int32` **přeteče** a vrátí ti
  nesmysl, který v poli klidně existuje. Skrytý test na to čeká.

```bash
go test ./hackerrank/tasks/01-pairs-with-diff/
```

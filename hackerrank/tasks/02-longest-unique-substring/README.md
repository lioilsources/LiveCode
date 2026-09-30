# Task 02 — Longest substring without repeating characters

**Časový limit: 15 minut** · HackerRank *Medium* · vzor: sliding window (proměnná šířka)

## Zadání

Given a string `s`, return the length of the longest substring that contains
no repeating characters.

```go
func LongestUniqueSubstring(s string) int
```

### Constraints

- `0 ≤ len(s) ≤ 10^6`
- `s` may contain any Unicode characters (UTF-8 encoded)

### Sample Input

```
abcabcbb
```

### Sample Output

```
3
```

### Explanation

The answer is `"abc"`, with length 3. Note that `"bca"` and `"cab"` also qualify.

## Na co si dát pozor

- „Character" znamená **znak**, ne bajt. `s[i]` je bajt; `č` jsou dva bajty.
- Okno proměnné šířky: pravý okraj jde vždy dopředu, levý skáče jen doprava —
  na index za poslední výskyt opakovaného znaku. Každý znak se zpracuje 2×
  nejvýš → `O(n)`.

```bash
go test ./hackerrank/tasks/02-longest-unique-substring/
```

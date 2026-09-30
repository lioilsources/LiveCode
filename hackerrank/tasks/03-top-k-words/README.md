# Task 03 — Top K frequent words

**Časový limit: 15 minut** · HackerRank *Medium* · vzor: mapa + řazení s víc klíči

## Zadání

Given a text and an integer `k`, return the `k` most frequent words.
Words are separated by whitespace and compared **case-insensitively**
(return them in lowercase). Sort the result by frequency, highest first;
words with the same frequency are sorted alphabetically.
If there are fewer than `k` distinct words, return all of them.

```go
func TopKWords(text string, k int) []string
```

### Constraints

- `0 ≤ len(text) ≤ 10^6`
- `1 ≤ k ≤ 10^5`

### Sample Input

```
the cat and The dog and the bird
2
```

### Sample Output

```
the
and
```

### Explanation

`the` appears 3 times, `and` 2 times, everything else once.

## Na co si dát pozor

- `strings.Fields` místo `strings.Split(s, " ")` — víc mezer, taby, nové řádky.
- Vytáhni klíče z mapy do slice a **seřaď** — pořadí iterace mapy je náhodné.
- Dva klíče řazení: `if cnt[a] != cnt[b] { return cnt[a] > cnt[b] }; return a < b`.

```bash
go test ./hackerrank/tasks/03-top-k-words/
```

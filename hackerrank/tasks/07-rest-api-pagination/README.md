# Task 07 — REST API: total goals by a team

**Časový limit: 20 minut** · HackerRank *„REST API" (backend)* · vzor: stránkované volání + JSON

Tenhle typ úlohy HackerRank dává na backendové pozice velmi často. Není to
algoritmus, je to „umíš zavolat HTTP, projít všechny stránky a nesplést se
v JSONu".

## Zadání

In this challenge, the REST API contains information about football matches.
Given a team name and a year, compute the **total number of goals** the team
scored in that year, both as home team (`team1`) and as away team (`team2`).

To access the collection of matches, perform HTTP GET requests to

```
{baseURL}/api/football_matches?year={year}&team1={team}&page={page}
{baseURL}/api/football_matches?year={year}&team2={team}&page={page}
```

The response is a JSON object:

```json
{
  "page": 1,
  "per_page": 10,
  "total": 25,
  "total_pages": 3,
  "data": [
    {
      "competition": "UEFA Champions League",
      "year": 2011,
      "round": "GroupH",
      "team1": "Barcelona",
      "team2": "AC Milan",
      "team1goals": "2",
      "team2goals": "2"
    }
  ]
}
```

- `page` — the current page, `total_pages` — number of pages, `data` — matches on this page.
- The data is **paginated**: you must request every page.
- Use `team1goals` when the team is `team1` and `team2goals` when the team is `team2`.

```go
func TotalGoals(baseURL, team string, year int) (int, error)
```

Return an error if any request fails or returns a non-200 status.

### Sample

For `team = "Barcelona"`, `year = 2011` the function returns `28`
(the test data is smaller — see the test file).

## Na co si dát pozor

- **Čísla jsou v JSONu jako stringy** (`"team1goals": "2"`). Dekóduj do `string`
  a převeď přes `strconv.Atoi`, nebo použij tag `` `json:"team1goals,string"` ``.
  Když necháš `int`, `Decode` vrátí chybu — a ty si toho nevšimneš, pokud chybu ignoruješ.
- Stránkování: cyklus `for page := 1; ; page++`, konec když `page >= total_pages`.
  Když `total_pages == 0` (tým nenalezen), skonči po první stránce s výsledkem 0.
- **`resp.Body.Close()` v cyklu** — ne `defer`, ten by se vykonal až na konci funkce.
- Jméno týmu do URL přes `url.QueryEscape` (mezery: `"Real Madrid"`).
- Na ostrém HackerRanku bývá base URL napevno `https://jsonmock.hackerrank.com`;
  tady je parametr kvůli testu s `httptest.Server`.

```bash
go test ./hackerrank/tasks/07-rest-api-pagination/
```

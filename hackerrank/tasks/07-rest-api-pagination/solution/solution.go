package solution

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
)

type matchesPage struct {
	Page       int `json:"page"`
	TotalPages int `json:"total_pages"`
	Data       []struct {
		Team1      string `json:"team1"`
		Team2      string `json:"team2"`
		Team1Goals string `json:"team1goals"`
		Team2Goals string `json:"team2goals"`
	} `json:"data"`
}

// TotalGoals sečte góly týmu team v roce year jako team1 i team2 přes všechny
// stránky API.
func TotalGoals(baseURL, team string, year int) (int, error) {
	total := 0
	for _, side := range []string{"team1", "team2"} {
		for page := 1; ; page++ {
			u := fmt.Sprintf("%s/api/football_matches?year=%d&%s=%s&page=%d",
				baseURL, year, side, url.QueryEscape(team), page)
			pg, err := fetchPage(u)
			if err != nil {
				return 0, err
			}
			for _, m := range pg.Data {
				goals := m.Team1Goals
				if side == "team2" {
					goals = m.Team2Goals
				}
				g, err := strconv.Atoi(goals)
				if err != nil {
					return 0, fmt.Errorf("parse goals %q: %w", goals, err)
				}
				total += g
			}
			if page >= pg.TotalPages {
				break
			}
		}
	}
	return total, nil
}

func fetchPage(u string) (*matchesPage, error) {
	resp, err := http.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close() // tady je defer OK: jsme v samostatné funkci volané per stránka
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GET %s: status %d", u, resp.StatusCode)
	}
	var pg matchesPage
	if err := json.NewDecoder(resp.Body).Decode(&pg); err != nil {
		return nil, fmt.Errorf("decode %s: %w", u, err)
	}
	return &pg, nil
}

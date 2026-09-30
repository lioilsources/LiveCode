package task

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
)

type match struct {
	Competition string `json:"competition"`
	Year        int    `json:"year"`
	Round       string `json:"round"`
	Team1       string `json:"team1"`
	Team2       string `json:"team2"`
	Team1Goals  string `json:"team1goals"` // záměrně string — tak to vrací jsonmock
	Team2Goals  string `json:"team2goals"`
}

var fixtures = []match{
	{"UEFA Champions League", 2011, "GroupH", "Barcelona", "AC Milan", "2", "2"},
	{"UEFA Champions League", 2011, "GroupH", "Barcelona", "Viktoria Plzen", "2", "0"},
	{"UEFA Champions League", 2011, "GroupH", "BATE Borisov", "Barcelona", "0", "5"},
	{"UEFA Champions League", 2011, "GroupH", "AC Milan", "Barcelona", "2", "3"},
	{"UEFA Champions League", 2011, "GroupH", "Viktoria Plzen", "Barcelona", "0", "4"},
	{"UEFA Champions League", 2011, "R16", "Bayer Leverkusen", "Barcelona", "1", "3"},
	{"UEFA Champions League", 2011, "R16", "Barcelona", "Bayer Leverkusen", "7", "1"},
	{"UEFA Champions League", 2011, "QF", "AC Milan", "Barcelona", "0", "0"},
	{"UEFA Champions League", 2011, "QF", "Barcelona", "AC Milan", "3", "1"},
	{"UEFA Champions League", 2011, "SF", "Chelsea", "Barcelona", "1", "0"},
	{"UEFA Champions League", 2011, "SF", "Barcelona", "Chelsea", "2", "2"},
	{"UEFA Champions League", 2012, "GroupG", "Barcelona", "Spartak Moskva", "3", "2"}, // jiný rok
	{"UEFA Champions League", 2011, "GroupA", "Real Madrid", "Lyon", "4", "0"},         // jiný tým
}

// Barcelona 2011: team1 = 2+2+7+3+2 = 16, team2 = 5+3+4+3+0+0 = 15 → 31
const barcelona2011 = 31

// newMockAPI vrací server chovající se jako jsonmock.hackerrank.com s per_page = 2.
func newMockAPI(t *testing.T, perPage int, requests *int64) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt64(requests, 1)
		if r.URL.Path != "/api/football_matches" {
			http.NotFound(w, r)
			return
		}
		q := r.URL.Query()
		year, _ := strconv.Atoi(q.Get("year"))
		page, _ := strconv.Atoi(q.Get("page"))
		if page < 1 {
			page = 1
		}
		var rows []match
		for _, m := range fixtures {
			if m.Year != year {
				continue
			}
			if t1 := q.Get("team1"); t1 != "" && m.Team1 != t1 {
				continue
			}
			if t2 := q.Get("team2"); t2 != "" && m.Team2 != t2 {
				continue
			}
			rows = append(rows, m)
		}
		totalPages := (len(rows) + perPage - 1) / perPage
		lo := (page - 1) * perPage
		hi := lo + perPage
		if lo > len(rows) {
			lo = len(rows)
		}
		if hi > len(rows) {
			hi = len(rows)
		}
		data := rows[lo:hi]
		if data == nil {
			data = []match{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"page":        page,
			"per_page":    perPage,
			"total":       len(rows),
			"total_pages": totalPages,
			"data":        data,
		})
	}))
}

func TestTotalGoalsPaginated(t *testing.T) {
	var requests int64
	srv := newMockAPI(t, 2, &requests)
	defer srv.Close()

	got, err := TotalGoals(srv.URL, "Barcelona", 2011)
	if err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if got != barcelona2011 {
		t.Fatalf("got %d, chci %d (prošel jsi VŠECHNY stránky pro team1 i team2?)", got, barcelona2011)
	}
	// team1: 5 zápasů → 3 stránky; team2: 6 zápasů → 3 stránky
	if requests != 6 {
		t.Errorf("provedeno %d requestů, čekám 6 (3 stránky team1 + 3 stránky team2)", requests)
	}
}

func TestTotalGoalsSinglePage(t *testing.T) {
	var requests int64
	srv := newMockAPI(t, 100, &requests)
	defer srv.Close()

	got, err := TotalGoals(srv.URL, "Barcelona", 2011)
	if err != nil || got != barcelona2011 {
		t.Fatalf("got (%d, %v), chci (%d, nil)", got, err, barcelona2011)
	}
	if requests != 2 {
		t.Errorf("provedeno %d requestů, čekám 2 — u total_pages=1 nesmíš volat page=2", requests)
	}
}

func TestTotalGoalsUnknownTeam(t *testing.T) {
	var requests int64
	srv := newMockAPI(t, 2, &requests)
	defer srv.Close()

	got, err := TotalGoals(srv.URL, "Sparta Praha", 2011)
	if err != nil || got != 0 {
		t.Fatalf("got (%d, %v), chci (0, nil) — total_pages=0 nesmí způsobit nekonečný cyklus ani chybu", got, err)
	}
}

func TestTotalGoalsTeamNameWithSpace(t *testing.T) {
	var requests int64
	srv := newMockAPI(t, 2, &requests)
	defer srv.Close()

	got, err := TotalGoals(srv.URL, "Real Madrid", 2011)
	if err != nil || got != 4 {
		t.Fatalf("got (%d, %v), chci (4, nil) — escapuješ jméno týmu v URL?", got, err)
	}
}

func TestTotalGoalsServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", http.StatusInternalServerError)
	}))
	defer srv.Close()

	if _, err := TotalGoals(srv.URL, "Barcelona", 2011); err == nil {
		t.Fatal("při HTTP 500 chci chybu, got nil")
	}
}

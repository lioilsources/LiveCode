package drill

import (
	"maps"
	"testing"
)

func TestWordFreq(t *testing.T) {
	cases := []struct {
		in   string
		want map[string]int
	}{
		{"Go is fun, go is FAST.", map[string]int{"go": 2, "is": 2, "fun": 1, "fast": 1}},
		{"one", map[string]int{"one": 1}},
		{"  a  a\tA\n", map[string]int{"a": 3}},
		{"Žluťoučký kůň, ŽLUŤOUČKÝ!", map[string]int{"žluťoučký": 2, "kůň": 1}},
		{"", map[string]int{}},
	}
	for _, c := range cases {
		got := WordFreq(c.in)
		if got == nil {
			t.Errorf("WordFreq(%q) vrátil nil, chci prázdnou mapu", c.in)
			continue
		}
		if !maps.Equal(got, c.want) {
			t.Errorf("WordFreq(%q) = %v, chci %v", c.in, got, c.want)
		}
	}
}

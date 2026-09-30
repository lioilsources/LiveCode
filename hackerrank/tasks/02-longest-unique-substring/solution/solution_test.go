package solution

import (
	"strings"
	"testing"
	"time"
)

func TestLongestUniqueSubstring(t *testing.T) {
	cases := map[string]int{
		"abcabcbb": 3,
		"bbbbb":    1,
		"pwwkew":   3,
		"":         0,
		"a":        1,
		"abcdef":   6,
		"abba":     2, // levý okraj nesmí couvat: po "abb" je left=2, 'a' na 0 už je mimo okno
		"čočka":    4, // "očka" — v bajtech by vyšlo 5, což je špatně
		"dvdf":     3,
	}
	for in, want := range cases {
		if got := LongestUniqueSubstring(in); got != want {
			t.Errorf("LongestUniqueSubstring(%q) = %d, chci %d", in, got, want)
		}
	}
}

func TestLongestUniqueSubstringLarge(t *testing.T) {
	// 10^6 znaků: abecedu opakuj → nejdelší unikátní běh je 26
	s := strings.Repeat("abcdefghijklmnopqrstuvwxyz", 1_000_000/26)
	start := time.Now()
	if got := LongestUniqueSubstring(s); got != 26 {
		t.Fatalf("got %d, chci 26", got)
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("10^6 znaků trvalo %v — O(n²)?", d)
	}
}

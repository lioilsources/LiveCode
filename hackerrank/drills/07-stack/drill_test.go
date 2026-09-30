package drill

import "testing"

func TestBalanced(t *testing.T) {
	cases := map[string]bool{
		"":         true,
		"()":       true,
		"([]{})":   true,
		"{[()()]}": true,
		"([)]":     false,
		"((":       false,
		")":        false, // pop z prázdného stacku — nesmí spadnout
		"())":      false,
		"{":        false,
		"[]]":      false,
	}
	for in, want := range cases {
		if got := Balanced(in); got != want {
			t.Errorf("Balanced(%q) = %v, chci %v", in, got, want)
		}
	}
}

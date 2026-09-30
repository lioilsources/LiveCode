package drill

import (
	"testing"
	"time"
)

func TestMaxWindowSum(t *testing.T) {
	cases := []struct {
		in     []int
		k      int
		want   int
		wantOK bool
	}{
		{[]int{1, 4, 2, 10, 2, 3, 1, 0, 20}, 4, 24, true},
		{[]int{-1, -2, -3, -4}, 2, -3, true}, // všechno záporné — best nezačínej na 0!
		{[]int{5}, 1, 5, true},
		{[]int{1, 2, 3}, 3, 6, true},
		{[]int{1, 2, 3}, 4, 0, false},
		{[]int{1, 2, 3}, 0, 0, false},
		{[]int{}, 1, 0, false},
	}
	for _, c := range cases {
		got, ok := MaxWindowSum(c.in, c.k)
		if got != c.want || ok != c.wantOK {
			t.Errorf("MaxWindowSum(%v, %d) = (%d, %v), chci (%d, %v)", c.in, c.k, got, ok, c.want, c.wantOK)
		}
	}
}

func TestMaxWindowSumIsLinear(t *testing.T) {
	const n = 2_000_000
	a := make([]int, n)
	for i := range a {
		a[i] = i % 7
	}
	start := time.Now()
	got, ok := MaxWindowSum(a, n/2)
	if !ok || got <= 0 {
		t.Fatalf("got (%d, %v)", got, ok)
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("trvalo %v — přepočítáváš okno od nuly?", d)
	}
}

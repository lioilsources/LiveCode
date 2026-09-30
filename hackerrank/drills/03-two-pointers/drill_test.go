package drill

import (
	"testing"
	"time"
)

func TestPairWithSum(t *testing.T) {
	cases := []struct {
		in     []int
		target int
		wantI  int
		wantJ  int
		wantOK bool
	}{
		{[]int{1, 2, 4, 7, 11}, 9, 1, 3, true},
		{[]int{1, 2, 4, 7, 11}, 12, 0, 4, true},
		{[]int{1, 2, 4, 7, 11}, 100, 0, 0, false},
		{[]int{-5, -1, 0, 3, 8}, 2, 1, 3, true},
		{[]int{3, 3}, 6, 0, 1, true},
		{[]int{3}, 6, 0, 0, false},
		{[]int{}, 0, 0, 0, false},
	}
	for _, c := range cases {
		i, j, ok := PairWithSum(c.in, c.target)
		if ok != c.wantOK || (ok && (i != c.wantI || j != c.wantJ)) {
			t.Errorf("PairWithSum(%v, %d) = (%d, %d, %v), chci (%d, %d, %v)",
				c.in, c.target, i, j, ok, c.wantI, c.wantJ, c.wantOK)
		}
	}
}

func TestPairWithSumIsLinear(t *testing.T) {
	const n = 1_000_000
	a := make([]int, n)
	for i := range a {
		a[i] = 2 * i // sudá čísla → lichý target nemá řešení
	}
	start := time.Now()
	if _, _, ok := PairWithSum(a, 1); ok {
		t.Fatal("řešení neexistuje, ale vrátils ok=true")
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("trvalo %v — to není O(n)", d)
	}
}

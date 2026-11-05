package drill

import (
	"testing"
	"time"
)

func TestTwoSum(t *testing.T) {
	cases := []struct {
		in     []int
		target int
		i, j   int
		ok     bool
	}{
		{[]int{2, 7, 11, 15}, 9, 0, 1, true},
		{[]int{3, 2, 4}, 6, 1, 2, true},
		{[]int{3, 3}, 6, 0, 1, true},
		{[]int{1, 5, 1, 5}, 6, 0, 1, true},
		{[]int{-4, 10, 4}, 0, 0, 2, true},
		{[]int{1, 2, 3}, 100, 0, 0, false},
		{[]int{5}, 10, 0, 0, false},
		{[]int{}, 0, 0, 0, false},
	}
	for _, c := range cases {
		i, j, ok := TwoSum(c.in, c.target)
		if ok != c.ok || (ok && (i != c.i || j != c.j)) {
			t.Errorf("TwoSum(%v, %d) = (%d, %d, %v), chci (%d, %d, %v)", c.in, c.target, i, j, ok, c.i, c.j, c.ok)
		}
	}
}

func TestTwoSumIsLinear(t *testing.T) {
	const n = 1_000_000
	a := make([]int, n)
	for i := range a {
		a[i] = 2 * (n - i) // sudá čísla → lichý target nemá řešení
	}
	start := time.Now()
	if _, _, ok := TwoSum(a, 1); ok {
		t.Fatal("řešení neexistuje, ale vrátils ok=true")
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Errorf("trvalo %v — to není O(n)", d)
	}
}

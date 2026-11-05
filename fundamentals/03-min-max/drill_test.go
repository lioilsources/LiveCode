package drill

import "testing"

func TestMinMax(t *testing.T) {
	cases := []struct {
		in     []int
		lo, hi int
		ok     bool
	}{
		{[]int{3, 1, 4, 1, 5}, 1, 5, true},
		{[]int{-3, -7, -1}, -7, -1, true},
		{[]int{42}, 42, 42, true},
		{[]int{}, 0, 0, false},
	}
	for _, c := range cases {
		lo, hi, ok := MinMax(c.in)
		if lo != c.lo || hi != c.hi || ok != c.ok {
			t.Errorf("MinMax(%v) = (%d, %d, %v), chci (%d, %d, %v)", c.in, lo, hi, ok, c.lo, c.hi, c.ok)
		}
	}
}

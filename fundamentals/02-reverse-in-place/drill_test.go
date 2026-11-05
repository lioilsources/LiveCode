package drill

import (
	"slices"
	"testing"
)

func TestReverseInPlace(t *testing.T) {
	cases := []struct{ in, want []int }{
		{[]int{1, 2, 3}, []int{3, 2, 1}},
		{[]int{1, 2, 3, 4}, []int{4, 3, 2, 1}},
		{[]int{7}, []int{7}},
		{[]int{}, []int{}},
	}
	for _, c := range cases {
		a := slices.Clone(c.in)
		ReverseInPlace(a)
		if !slices.Equal(a, c.want) {
			t.Errorf("ReverseInPlace(%v) → %v, chci %v", c.in, a, c.want)
		}
	}
}

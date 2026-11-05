package drill

import (
	"slices"
	"testing"
)

func TestReverse(t *testing.T) {
	cases := []struct{ in, want []int }{
		{[]int{1, 2, 3}, []int{3, 2, 1}},
		{[]int{1, 2, 3, 4}, []int{4, 3, 2, 1}},
		{[]int{7}, []int{7}},
		{[]int{}, []int{}},
	}
	for _, c := range cases {
		orig := slices.Clone(c.in)
		got := Reverse(c.in)
		if !slices.Equal(got, c.want) {
			t.Errorf("Reverse(%v) = %v, chci %v", orig, got, c.want)
		}
		if !slices.Equal(c.in, orig) {
			t.Errorf("Reverse změnil vstup: %v → %v", orig, c.in)
		}
	}
}

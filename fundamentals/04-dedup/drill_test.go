package drill

import (
	"slices"
	"testing"
)

func TestDedup(t *testing.T) {
	cases := []struct{ in, want []int }{
		{[]int{3, 1, 3, 2, 1}, []int{3, 1, 2}},
		{[]int{5, 5, 5}, []int{5}},
		{[]int{1, 2, 3}, []int{1, 2, 3}},
		{[]int{}, []int{}},
	}
	for _, c := range cases {
		orig := slices.Clone(c.in)
		got := Dedup(c.in)
		if !slices.Equal(got, c.want) {
			t.Errorf("Dedup(%v) = %v, chci %v", orig, got, c.want)
		}
		if !slices.Equal(c.in, orig) {
			t.Errorf("Dedup změnil vstup: %v → %v", orig, c.in)
		}
	}
}

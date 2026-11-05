package drill

import (
	"slices"
	"testing"
)

func TestRotateRight(t *testing.T) {
	cases := []struct {
		in   []int
		k    int
		want []int
	}{
		{[]int{1, 2, 3, 4, 5}, 2, []int{4, 5, 1, 2, 3}},
		{[]int{1, 2, 3, 4, 5}, 0, []int{1, 2, 3, 4, 5}},
		{[]int{1, 2, 3, 4, 5}, 5, []int{1, 2, 3, 4, 5}},
		{[]int{1, 2, 3, 4, 5}, 7, []int{4, 5, 1, 2, 3}},
		{[]int{9}, 3, []int{9}},
		{[]int{}, 3, []int{}},
	}
	for _, c := range cases {
		orig := slices.Clone(c.in)
		got := RotateRight(c.in, c.k)
		if !slices.Equal(got, c.want) {
			t.Errorf("RotateRight(%v, %d) = %v, chci %v", orig, c.k, got, c.want)
		}
		if !slices.Equal(c.in, orig) {
			t.Errorf("RotateRight změnil vstup: %v → %v", orig, c.in)
		}
	}
}

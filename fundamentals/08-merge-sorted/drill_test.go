package drill

import (
	"slices"
	"testing"
)

func TestMergeSorted(t *testing.T) {
	cases := []struct{ a, b, want []int }{
		{[]int{1, 3, 5}, []int{2, 4, 6}, []int{1, 2, 3, 4, 5, 6}},
		{[]int{1, 1, 2}, []int{1, 3}, []int{1, 1, 1, 2, 3}},
		{[]int{}, []int{1, 2}, []int{1, 2}},
		{[]int{5}, []int{}, []int{5}},
		{[]int{}, []int{}, []int{}},
		{[]int{-3, 10}, []int{-5, 0, 0, 20}, []int{-5, -3, 0, 0, 10, 20}},
	}
	for _, c := range cases {
		if got := MergeSorted(c.a, c.b); !slices.Equal(got, c.want) {
			t.Errorf("MergeSorted(%v, %v) = %v, chci %v", c.a, c.b, got, c.want)
		}
	}
}

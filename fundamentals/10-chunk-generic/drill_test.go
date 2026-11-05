package drill

import (
	"slices"
	"testing"
)

func equalChunks[T comparable](a, b [][]T) bool {
	return slices.EqualFunc(a, b, func(x, y []T) bool { return slices.Equal(x, y) })
}

func TestChunkInts(t *testing.T) {
	cases := []struct {
		in   []int
		size int
		want [][]int
	}{
		{[]int{1, 2, 3, 4, 5}, 2, [][]int{{1, 2}, {3, 4}, {5}}},
		{[]int{1, 2, 3, 4}, 2, [][]int{{1, 2}, {3, 4}}},
		{[]int{1, 2}, 5, [][]int{{1, 2}}},
		{[]int{}, 3, [][]int{}},
	}
	for _, c := range cases {
		if got := Chunk(c.in, c.size); !equalChunks(got, c.want) {
			t.Errorf("Chunk(%v, %d) = %v, chci %v", c.in, c.size, got, c.want)
		}
	}
	if got := Chunk([]int{1, 2}, 0); got != nil {
		t.Errorf("Chunk(size=0) = %v, chci nil", got)
	}
}

func TestChunkStrings(t *testing.T) {
	got := Chunk([]string{"a", "b", "c"}, 2)
	want := [][]string{{"a", "b"}, {"c"}}
	if !equalChunks(got, want) {
		t.Errorf("Chunk(strings) = %v, chci %v", got, want)
	}
}

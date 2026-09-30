package solution

import (
	"math"
	"testing"
	"time"
)

func TestCountPairsSample(t *testing.T) {
	if got := CountPairs([]int32{1, 5, 3, 4, 2}, 2); got != 3 {
		t.Fatalf("sample: got %d, chci 3", got)
	}
}

func TestCountPairs(t *testing.T) {
	cases := []struct {
		name string
		arr  []int32
		k    int32
		want int32
	}{
		{"žádný pár", []int32{1, 2, 3}, 5, 0},
		{"všechny sousední", []int32{10, 20, 30, 40}, 10, 3},
		{"záporná čísla", []int32{-3, 0, 3, -6}, 3, 3},
		{"pořadí nehraje roli", []int32{7, 1, 4}, 3, 2},
		{"hranice int32 — x+k přeteče", []int32{math.MaxInt32, math.MinInt32}, 1, 0},
		{"hranice int32 — platný pár", []int32{math.MaxInt32, 0}, math.MaxInt32, 1},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := CountPairs(c.arr, c.k); got != c.want {
				t.Fatalf("CountPairs(%v, %d) = %d, chci %d", c.arr, c.k, got, c.want)
			}
		})
	}
}

func TestCountPairsLarge(t *testing.T) {
	const n = 200_000
	arr := make([]int32, n)
	for i := range arr {
		arr[i] = int32(i * 3) // 0, 3, 6, ... → každý má partnera s rozdílem 3 kromě posledního
	}
	start := time.Now()
	got := CountPairs(arr, 3)
	if got != n-1 {
		t.Fatalf("got %d, chci %d", got, n-1)
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("n=2·10^5 trvalo %v — to je O(n²)?", d)
	}
}

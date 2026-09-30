package task

import (
	"testing"
	"time"
)

func TestMinCoins(t *testing.T) {
	cases := []struct {
		name   string
		coins  []int
		amount int
		want   int
	}{
		{"sample", []int{1, 2, 5}, 11, 3},
		{"greedy selže", []int{1, 3, 4}, 6, 2},
		{"nejde", []int{2}, 3, -1},
		{"nula", []int{1}, 0, 0},
		{"přesně jedna mince", []int{7}, 7, 1},
		{"velké mince", []int{186, 419, 83, 408}, 6249, 20},
		{"jen velké, nejde", []int{5, 10}, 3, -1},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := MinCoins(c.coins, c.amount); got != c.want {
				t.Fatalf("MinCoins(%v, %d) = %d, chci %d", c.coins, c.amount, got, c.want)
			}
		})
	}
}

func TestMinCoinsLarge(t *testing.T) {
	coins := make([]int, 50)
	for i := range coins {
		coins[i] = 2*i + 3 // 3, 5, 7, ..., 101 — samé liché mince
	}
	// 100000 je sudé → potřebuješ sudý počet lichých mincí; 100000/101 > 990,
	// takže minimálně 991, a nejbližší sudé je 992 (992×101 = 100192 ≥ 100000, jde vyskládat).
	start := time.Now()
	if got := MinCoins(coins, 100_000); got != 992 {
		t.Fatalf("got %d, chci 992", got)
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("amount=10^5, 50 mincí trvalo %v", d)
	}
}

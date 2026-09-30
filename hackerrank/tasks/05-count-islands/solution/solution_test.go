package solution

import (
	"bytes"
	"testing"
	"time"
)

func toGrid(rows ...string) [][]byte {
	g := make([][]byte, len(rows))
	for i, r := range rows {
		g[i] = []byte(r)
	}
	return g
}

func TestCountIslands(t *testing.T) {
	cases := []struct {
		name string
		grid [][]byte
		want int
	}{
		{"sample", toGrid("11000", "11000", "00100", "00011"), 3},
		{"jeden velký", toGrid("111", "111"), 1},
		{"samá voda", toGrid("000", "000"), 0},
		{"diagonála se nepočítá", toGrid("10", "01"), 2},
		{"prázdná mřížka", [][]byte{}, 0},
		{"jeden řádek", toGrid("1011101"), 3},
		{"jeden sloupec", toGrid("1", "0", "1"), 2},
		{"prstenec", toGrid("111", "101", "111"), 1},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := CountIslands(c.grid); got != c.want {
				t.Fatalf("got %d, chci %d", got, c.want)
			}
		})
	}
}

func TestCountIslandsLarge(t *testing.T) {
	const n = 1000
	// šachovnice → n*n/2 ostrovů; pak plná mřížka → 1 ostrov
	board := make([][]byte, n)
	for r := range board {
		board[r] = make([]byte, n)
		for c := range board[r] {
			if (r+c)%2 == 0 {
				board[r][c] = '1'
			} else {
				board[r][c] = '0'
			}
		}
	}
	full := make([][]byte, n)
	for r := range full {
		full[r] = bytes.Repeat([]byte("1"), n)
	}

	start := time.Now()
	if got := CountIslands(board); got != n*n/2 {
		t.Fatalf("šachovnice: got %d, chci %d", got, n*n/2)
	}
	if got := CountIslands(full); got != 1 {
		t.Fatalf("plná: got %d, chci 1", got)
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Errorf("2× 1000×1000 trvalo %v", d)
	}
}

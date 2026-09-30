package drill

import (
	"strings"
	"testing"
	"time"
)

func TestShortestPath(t *testing.T) {
	cases := []struct {
		name string
		grid []string
		want int
	}{
		{"rovně", []string{"S..E"}, 3},
		{"obejít zeď", []string{
			"S.#",
			".##",
			"..E",
		}, 4},
		{"nedosažitelné", []string{
			"S#E",
		}, -1},
		{"S vedle E", []string{"SE"}, 1},
		{"bludiště", []string{
			"S.#.....",
			".##.###.",
			"....#...",
			"###.#.#E",
			".....#..",
		}, 14},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := ShortestPath(c.grid); got != c.want {
				t.Fatalf("ShortestPath(\n%s\n) = %d, chci %d", strings.Join(c.grid, "\n"), got, c.want)
			}
		})
	}
}

func TestShortestPathBigOpenGrid(t *testing.T) {
	const n = 1000
	row := strings.Repeat(".", n)
	grid := make([]string, n)
	for i := range grid {
		grid[i] = row
	}
	grid[0] = "S" + row[1:]
	grid[n-1] = row[:n-1] + "E"

	start := time.Now()
	if got := ShortestPath(grid); got != 2*(n-1) {
		t.Fatalf("got %d, chci %d", got, 2*(n-1))
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Errorf("1000×1000 trvalo %v", d)
	}
}

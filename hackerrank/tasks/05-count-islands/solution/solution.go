package solution

// CountIslands vrátí počet ostrovů ('1') v mřížce, sousedství 4-směrné.
// Grid smí funkce modifikovat.
func CountIslands(grid [][]byte) int {
	R := len(grid)
	if R == 0 {
		return 0
	}
	C := len(grid[0])
	type pt struct{ r, c int }
	dr := []int{-1, 1, 0, 0}
	dc := []int{0, 0, -1, 1}

	count := 0
	queue := make([]pt, 0, 1024)
	for r := 0; r < R; r++ {
		for c := 0; c < C; c++ {
			if grid[r][c] != '1' {
				continue
			}
			count++
			grid[r][c] = '0'
			queue = append(queue[:0], pt{r, c})
			for len(queue) > 0 {
				p := queue[0]
				queue = queue[1:]
				for d := 0; d < 4; d++ {
					nr, nc := p.r+dr[d], p.c+dc[d]
					if nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] != '1' {
						continue
					}
					grid[nr][nc] = '0'
					queue = append(queue, pt{nr, nc})
				}
			}
		}
	}
	return count
}

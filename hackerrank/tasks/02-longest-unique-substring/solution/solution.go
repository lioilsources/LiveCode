package solution

// LongestUniqueSubstring vrátí délku (v znacích) nejdelšího podřetězce s
// bez opakujících se znaků.
func LongestUniqueSubstring(s string) int {
	r := []rune(s)
	last := make(map[rune]int, len(r)) // rune → index posledního výskytu
	best, left := 0, 0
	for right, c := range r {
		if idx, ok := last[c]; ok && idx >= left {
			left = idx + 1
		}
		last[c] = right
		if w := right - left + 1; w > best {
			best = w
		}
	}
	return best
}

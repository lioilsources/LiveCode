package solution

import "sort"

// MergeIntervals sloučí překrývající se nebo dotýkající se uzavřené intervaly
// a vrátí výsledek seřazený podle začátku.
func MergeIntervals(intervals [][2]int) [][2]int {
	if len(intervals) == 0 {
		return [][2]int{}
	}
	iv := intervals
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })

	out := [][2]int{iv[0]}
	for _, next := range iv[1:] {
		cur := &out[len(out)-1]
		if next[0] <= cur[1] {
			if next[1] > cur[1] {
				cur[1] = next[1]
			}
		} else {
			out = append(out, next)
		}
	}
	return out
}

package solution

// CountPairs vrátí počet dvojic (a, b) prvků z arr, pro které a - b == k.
// Prvky arr jsou navzájem různé, k > 0.
func CountPairs(arr []int32, k int32) int32 {
	seen := make(map[int64]struct{}, len(arr))
	for _, v := range arr {
		seen[int64(v)] = struct{}{}
	}
	var count int32
	for _, v := range arr {
		if _, ok := seen[int64(v)+int64(k)]; ok {
			count++
		}
	}
	return count
}

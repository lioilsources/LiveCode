package solution

import (
	"sort"
	"strings"
)

// TopKWords vrátí k nejčastějších slov textu (lowercase), seřazených podle
// četnosti sestupně a při shodě abecedně.
func TopKWords(text string, k int) []string {
	cnt := map[string]int{}
	for _, w := range strings.Fields(text) {
		cnt[strings.ToLower(w)]++
	}
	words := make([]string, 0, len(cnt))
	for w := range cnt {
		words = append(words, w)
	}
	sort.Slice(words, func(i, j int) bool {
		if cnt[words[i]] != cnt[words[j]] {
			return cnt[words[i]] > cnt[words[j]]
		}
		return words[i] < words[j]
	})
	if k < len(words) {
		words = words[:k]
	}
	return words
}

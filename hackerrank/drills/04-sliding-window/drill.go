// DRILL 04 — sliding window pevné šířky
//
// Napiš:
//
//	func MaxWindowSum(nums []int, k int) (int, bool)
//
// Vrať největší součet k po sobě jdoucích prvků. Když k <= 0 nebo k > len(nums),
// vrať (0, false).
//
// Musí být O(n): první okno sečti, další okna posouvej — jeden prvek přibude,
// jeden ubude. Žádné přepočítávání okna od nuly.
//
//	go test ./hackerrank/drills/04-sliding-window/
package drill

// DRILL 03 — two pointers na seřazeném poli
//
// Napiš:
//
//	func PairWithSum(sorted []int, target int) (i, j int, ok bool)
//
// sorted je vzestupně seřazené. Vrať indexy i < j tak, že
// sorted[i] + sorted[j] == target. Když víc řešení, vrať to s NEJMENŠÍM i.
// Když neexistuje, vrať (0, 0, false).
//
// Musí být O(n) — test to hlídá na 10^6 prvcích bez řešení, kde O(n²) nedoběhne.
//
// Sval: i zleva, j zprava, posun podle toho, jestli je součet malý nebo velký.
//
//	go test ./hackerrank/drills/03-two-pointers/
package drill

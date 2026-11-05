// FUNDAMENTALS 10 — rozděl na kousky (generika)
//
// Napiš:
//
//	func Chunk[T any](items []T, size int) [][]T
//
// [1,2,3,4,5], size=2 → [[1,2], [3,4], [5]]. Poslední kousek může být kratší.
// size <= 0 → nil. Prázdný vstup → prázdný výsledek.
//
// Nahlas: čas O(?), paměť O(?). Cíl: 3 min.
//
//	go test ./fundamentals/10-chunk-generic/
package drill

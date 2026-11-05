// FUNDAMENTALS 09 — rotace doprava o k
//
// Napiš:
//
//	func RotateRight(a []int, k int) []int
//
// [1,2,3,4,5], k=2 → [4,5,1,2,3]. Vrať nový slice, vstup neměň.
// k >= 0, může být větší než len(a). Prázdný vstup → prázdný výsledek
// (pozor na dělení nulou v k % len(a)).
//
// Nahlas: čas O(?), paměť O(?). Cíl: 3 min.
//
//	go test ./fundamentals/09-rotate/
package drill

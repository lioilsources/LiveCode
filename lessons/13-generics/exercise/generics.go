// Cvičení lekce 13 — zadání v README.md. Doplň TODO a spusť:
//
//	go test -race ./lessons/13-generics/exercise/
package exercise

// ── 1. Slice utility ─────────────────────────────────────────────────────────

// MapSlice aplikuje f na každý prvek. nil vstup → prázdný (ne nil) slice.
func MapSlice[T, U any](s []T, f func(T) U) []U {
	// TODO: implementuj
	return nil
}

// Filter vrátí prvky, pro které keep vrátí true. nil vstup → prázdný slice.
func Filter[T any](s []T, keep func(T) bool) []T {
	// TODO: implementuj
	return nil
}

// ── 2. Constraints ───────────────────────────────────────────────────────────

// SortedKeys vrátí klíče mapy seřazené vzestupně.
//
// TODO: doplň správný constraint pro K. `comparable` stačí na klíč mapy,
// ale na řazení potřebuješ typ, který umí `<`. (Koukni do balíku `cmp`.)
func SortedKeys[K comparable, V any](m map[K]V) []K {
	// TODO: implementuj
	return nil
}

// MaxOf vrátí největší prvek. Prázdný/nil slice → nulová hodnota T a false.
//
// TODO: doplň constraint, aby šlo použít `>`.
func MaxOf[T any](s []T) (T, bool) {
	// TODO: implementuj (pozor na `var zero T`)
	var zero T
	return zero, false
}

// ── 3. Vlnovka ───────────────────────────────────────────────────────────────

// Number je constraint pro čísla.
//
// TODO: definuj tak, aby prošly int, float64 A pojmenované typy nad nimi
// (např. `type Celsius float64`). Testy to zkouší.
type Number interface {
	int | float64
}

// Sum sečte všechny prvky. Prázdný slice → nulová hodnota T.
func Sum[T Number](s []T) T {
	// TODO: implementuj
	var total T
	return total
}

// ── 4. Generický typ ─────────────────────────────────────────────────────────

// Stack je LIFO zásobník libovolného typu.
type Stack[T any] struct {
	items []T
}

// NewStack vytvoří prázdný zásobník.
func NewStack[T any]() *Stack[T] {
	// TODO: implementuj
	return nil
}

// TODO: implementuj metody Push(v T), Pop() (T, bool) a Len() int.
// Pop z prázdného zásobníku vrací nulovou hodnotu T a false.

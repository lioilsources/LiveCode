// Constraints: co všechno smí za T přijít.
// Hlavní hvězda: vlnovka ~ (typy s daným underlying typem).
package main

import (
	"cmp"
	"fmt"
)

// ── comparable: umožní == a použití jako klíč mapy ───────────────────────────
func Unique[T comparable](s []T) []T {
	seen := make(map[T]struct{}, len(s))
	out := make([]T, 0, len(s))
	for _, v := range s {
		if _, dup := seen[v]; dup {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

// ── cmp.Ordered: umožní <, >, <=, >= ─────────────────────────────────────────
func MaxOf[T cmp.Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// ── Union constraint S vlnovkou vs BEZ vlnovky ───────────────────────────────

type WithTilde interface{ ~int | ~float64 }  // "a typy s tímhle základem"
type NoTilde interface{ int | float64 }      // JEN přesně int / float64

type Celsius float64 // vlastní typ, underlying = float64

func SumTilde[T WithTilde](xs []T) T {
	var total T
	for _, v := range xs {
		total += v
	}
	return total
}

func SumNoTilde[T NoTilde](xs []T) T {
	var total T
	for _, v := range xs {
		total += v
	}
	return total
}

func main() {
	fmt.Println("── comparable ──")
	fmt.Println(Unique([]int{1, 2, 2, 3, 1}))
	fmt.Println(Unique([]string{"a", "b", "a"}))

	fmt.Println("\n── cmp.Ordered ──")
	fmt.Println("MaxOf(3, 7)       =", MaxOf(3, 7))
	fmt.Println("MaxOf(2.5, 1.5)   =", MaxOf(2.5, 1.5))
	fmt.Println("MaxOf(\"a\", \"b\")   =", MaxOf("a", "b")) // stringy taky!

	fmt.Println("\n── vlnovka ~ ──")
	temps := []Celsius{20.5, 21.0, 22.5}

	fmt.Printf("SumTilde(temps)   = %.1f ✅ (~float64 pustí i Celsius)\n", float64(SumTilde(temps)))

	// fmt.Println(SumNoTilde(temps))
	// ☝️ ODKOMENTUJ → chyba při kompilaci:
	//    Celsius does not satisfy NoTilde (possibly missing ~ for float64)
	//
	// Bez vlnovky projdou jen doslova int/float64, žádné pojmenované typy.
	fmt.Println("SumNoTilde(temps) → ❌ nezkompiluje se (chybí ~)")

	fmt.Println("\nPravidlo: v unionech píšeš ~, pokud nechceš vyloučit vlastní typy.")
}

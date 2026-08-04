// Type parametry: jeden kód, mnoho typů, kontrola při kompilaci.
// Plus: kdy si kompilátor typ odvodí sám a kdy ho musíš napsat.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// Dva type parametry: vstupní T a výstupní U.
func MapSlice[T, U any](s []T, f func(T) U) []U {
	out := make([]U, 0, len(s))
	for _, v := range s {
		out = append(out, f(v))
	}
	return out
}

func Filter[T any](s []T, keep func(T) bool) []T {
	out := make([]T, 0, len(s))
	for _, v := range s {
		if keep(v) {
			out = append(out, v)
		}
	}
	return out
}

// Reduce: akumulátor je jiný typ než prvek.
func Reduce[T, U any](s []T, init U, f func(U, T) U) U {
	acc := init
	for _, v := range s {
		acc = f(acc, v)
	}
	return acc
}

func main() {
	nums := []int{1, 2, 3, 4, 5, 6}

	// Inference: kompilátor si T=int, U=string odvodí z argumentů.
	strs := MapSlice(nums, strconv.Itoa)
	fmt.Printf("MapSlice → %q (%T)\n", strs, strs)

	even := Filter(nums, func(n int) bool { return n%2 == 0 })
	fmt.Printf("Filter   → %v\n", even)

	sum := Reduce(nums, 0, func(acc, n int) int { return acc + n })
	fmt.Printf("Reduce   → %d\n", sum)

	// Akumulátor jiného typu než prvky:
	joined := Reduce(nums, "", func(acc string, n int) string {
		if acc == "" {
			return strconv.Itoa(n)
		}
		return acc + "-" + strconv.Itoa(n)
	})
	fmt.Printf("Reduce   → %q\n", joined)

	// Typová bezpečnost: tohle by se NEZKOMPILOVALO
	// _ = MapSlice(nums, func(s string) int { return len(s) })
	//     ☝️ func(string) int neodpovídá func(int) U

	explicitInstantiation()
}

func explicitInstantiation() {
	fmt.Println("\n── kdy typ psát explicitně ──")

	// Když se T objevuje JEN v návratové hodnotě, není z čeho odvodit.
	empty := NewEmpty[string]() // ← bez [string] se to nezkompiluje
	fmt.Printf("NewEmpty[string]() → %#v (%T)\n", empty, empty)

	// Jinak inference stačí a explicitní zápis je jen šum:
	up := MapSlice([]string{"a", "b"}, strings.ToUpper)
	fmt.Printf("inference stačí     → %v\n", up)
}

func NewEmpty[T any]() []T { return []T{} }

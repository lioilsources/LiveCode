// Method sets: pointer vs. value receiver.
// Nejčastější příčina chyby "X does not implement Y" — a častá interview otázka.
package main

import "fmt"

type Speaker interface{ Speak() string }

// ── Value receiver: splňují HODNOTA i POINTER ────────────────────────────────
type Dog struct{ Name string }

func (d Dog) Speak() string { return d.Name + ": woof" }

// ── Pointer receiver: splňuje JEN POINTER ────────────────────────────────────
type Counter struct{ n int }

func (c *Counter) Speak() string {
	c.n++ // mutace — právě proto musí být receiver pointer
	return fmt.Sprintf("counter: %d", c.n)
}

func main() {
	var s Speaker

	s = Dog{Name: "Rex"} // ✅ value receiver → hodnota stačí
	fmt.Println(s.Speak())

	s = &Dog{Name: "Max"} // ✅ pointer má i value metody
	fmt.Println(s.Speak())

	s = &Counter{} // ✅ pointer receiver → jen pointer
	fmt.Println(s.Speak())
	fmt.Println(s.Speak()) // stav se drží, protože v interfacu je pointer

	// s = Counter{}
	// ☝️ ODKOMENTUJ A ZKUS ZKOMPILOVAT — dostaneš:
	//    cannot use Counter{} as Speaker value: Counter does not implement
	//    Speaker (method Speak has pointer receiver)
	//
	// PROČ: kdyby to šlo, interface by držel KOPII. Metoda by inkrementovala
	// kopii a mutace by se ztratila. Go tenhle tichý bug nedovolí.

	demoLostMutation()
}

// Ukázka, proč to Go zakazuje: stejný efekt na hodnotě mimo interface.
func demoLostMutation() {
	fmt.Println("\n── proč pointer receiver ──")
	counters := map[string]Counter{"a": {}}
	// counters["a"].Speak()  // ani tohle nejde: mapa vrací nezadresovatelnou kopii

	c := counters["a"]
	c.Speak() // mutuje KOPII c, ne prvek v mapě
	fmt.Printf("v mapě zůstalo n=%d (mutace kopie se ztratila)\n", counters["a"].n)

	// Správně: pracuj s pointerem
	ptrs := map[string]*Counter{"a": {}}
	ptrs["a"].Speak()
	fmt.Printf("s pointerem n=%d ✅\n", ptrs["a"].n)
}

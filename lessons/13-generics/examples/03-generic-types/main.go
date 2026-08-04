// Generické typy (struktury), var zero T, a proč metody nemůžou
// mít vlastní type parametry.
package main

import "fmt"

// Stack je generický zásobník. Type param se opakuje na receiveru metod.
type Stack[T any] struct {
	items []T
}

func NewStack[T any]() *Stack[T] { return &Stack[T]{} }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T // ⚠️ jediný způsob, jak vyrobit nulovou hodnotu T
		return zero, false
	}
	v := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return v, true
}

func (s *Stack[T]) Len() int { return len(s.items) }

// ❌ TOHLE BY SE NEZKOMPILOVALO — metoda nesmí přidat nový type parametr:
//
//	func (s *Stack[T]) MapTo[U any](f func(T) U) *Stack[U] { ... }
//	   → syntax error: method must have no type parameters
//
// ✅ Řešení: volná funkce, která si U vezme jako svůj type param.
func MapStack[T, U any](s *Stack[T], f func(T) U) *Stack[U] {
	out := NewStack[U]()
	for _, v := range s.items {
		out.Push(f(v))
	}
	return out
}

func main() {
	ints := NewStack[int]()
	ints.Push(1)
	ints.Push(2)
	ints.Push(3)

	fmt.Println("Len:", ints.Len())
	v, ok := ints.Pop()
	fmt.Printf("Pop → %d, ok=%v\n", v, ok)

	// Převod Stack[int] → Stack[string] přes volnou funkci
	strs := MapStack(ints, func(n int) string { return fmt.Sprintf("#%d", n) })
	sv, _ := strs.Pop()
	fmt.Printf("MapStack → Stack[string], Pop = %q\n", sv)

	fmt.Println("\n── var zero T ──")
	empty := NewStack[string]()
	s, ok := empty.Pop()
	fmt.Printf("Pop z prázdného Stack[string] → %q, ok=%v  (zero = \"\")\n", s, ok)

	emptyP := NewStack[*int]()
	p, ok := emptyP.Pop()
	fmt.Printf("Pop z prázdného Stack[*int]   → %v, ok=%v  (zero = nil)\n", p, ok)

	fmt.Println("\nNulová hodnota T se liší podle typu — proto `var zero T`,")
	fmt.Println("nikdy ne `return nil` nebo `return 0`.")

	noCovariance()
}

type Animal interface{ Speak() string }
type Dog struct{}

func (Dog) Speak() string { return "woof" }

func noCovariance() {
	fmt.Println("\n── žádná kovariance ──")
	dogs := []Dog{{}, {}}

	// var animals []Animal = dogs
	// ☝️ NEZKOMPILUJE SE: []Dog není []Animal, i když Dog splňuje Animal.

	animals := make([]Animal, 0, len(dogs)) // musíš převést prvek po prvku
	for _, d := range dogs {
		animals = append(animals, d)
	}
	fmt.Printf("[]Dog → []Animal ručně: %d prvků, první říká %q\n", len(animals), animals[0].Speak())
}

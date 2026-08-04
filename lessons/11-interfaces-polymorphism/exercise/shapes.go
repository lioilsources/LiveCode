// Cvičení lekce 11 — zadání v README.md. Doplň TODO a spusť:
//
//	go test -race ./lessons/11-interfaces-polymorphism/exercise/
package exercise

import "fmt"

// ── 1. Shape ─────────────────────────────────────────────────────────────────

// Shape je tvar, u kterého umíme spočítat plochu a obvod.
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Circle je kruh o poloměru R.
type Circle struct{ R float64 }

// Rect je obdélník o rozměrech W × H.
type Rect struct{ W, H float64 }

// TODO: implementuj metody Area() a Perimeter() pro Circle a Rect.
// TODO: přidej compile-time kontrolu, že oba typy splňují Shape.

// ── 2. Polymorfní funkce ─────────────────────────────────────────────────────

// TotalArea vrátí součet ploch všech tvarů. Prázdný slice → 0.
func TotalArea(shapes []Shape) float64 {
	// TODO: implementuj
	return 0
}

// Largest vrátí tvar s největší plochou.
// Prázdný slice → (nil, false). Při shodě ploch vrať ten dřívější.
func Largest(shapes []Shape) (Shape, bool) {
	// TODO: implementuj
	return nil, false
}

// ── 3. Method set ────────────────────────────────────────────────────────────

// Counter umí zvýšit počítadlo a vrátit jeho novou hodnotu.
type Counter interface {
	Inc() int
}

// Tally je počítadlo volání. Musí jít použít jako `var c Counter = &Tally{}`
// a stav se musí držet mezi voláními.
type Tally struct {
	n int
}

// TODO: implementuj Inc() int tak, aby *Tally splňoval Counter
// a mutace se NEZTRÁCELA (rozmysli si receiver).

// ── 4. Typed nil ─────────────────────────────────────────────────────────────

// ValidationError popisuje neplatné pole.
type ValidationError struct {
	Field string
	Msg   string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Msg)
}

// Validate vrátí *ValidationError pro age < 0, jinak nil.
//
// 🧨 Pozor: musí platit `Validate(10) == nil`. Viz examples/03-typed-nil.
func Validate(age int) error {
	// TODO: implementuj
	return nil
}

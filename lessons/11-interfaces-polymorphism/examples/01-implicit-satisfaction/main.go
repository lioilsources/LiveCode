// Implicitní splnění interfacu: typ nikde nedeklaruje, že interface implementuje.
// Stačí, že má správné metody. Interface = zásuvka, ne rodokmen.
package main

import (
	"fmt"
	"math"
	"strings"
)

// Malý interface — jedna metoda. Definovaný na straně KONZUMENTA.
type Shape interface {
	Area() float64
}

type Circle struct{ R float64 }
type Rect struct{ W, H float64 }

// Nikde nepíšeme "implements Shape" — stačí mít metodu.
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }
func (r Rect) Area() float64   { return r.W * r.H }

// Compile-time kontrola: spadne při kompilaci, ne až v runtime.
var (
	_ Shape = (*Circle)(nil)
	_ Shape = (*Rect)(nil)
)

// Polymorfismus: funkce nezná konkrétní typy, jen chování.
func TotalArea(shapes []Shape) float64 {
	var sum float64
	for _, s := range shapes {
		sum += s.Area()
	}
	return sum
}

// Bonus: fmt.Stringer je taky jen interface s jednou metodou.
// Když ho typ splní, fmt.Println ho automaticky použije.
func (c Circle) String() string { return fmt.Sprintf("Circle(r=%.1f)", c.R) }

func main() {
	shapes := []Shape{Circle{R: 1}, Rect{W: 2, H: 3}, Circle{R: 2}}

	for _, s := range shapes {
		// fmt.Sprint nejdřív, pak padding — jinak se šířka aplikuje na pole structu
		fmt.Printf("  %-18s area=%.2f\n", fmt.Sprint(s), s.Area())
	}
	fmt.Printf("celkem: %.2f\n", TotalArea(shapes))

	// Ukázka "accept interfaces": strings.Builder splňuje io.Writer,
	// takže ho můžu předat čemukoli, co chce io.Writer.
	var sb strings.Builder
	fmt.Fprintf(&sb, "zapsáno přes io.Writer: %d tvarů", len(shapes))
	fmt.Println(sb.String())
}

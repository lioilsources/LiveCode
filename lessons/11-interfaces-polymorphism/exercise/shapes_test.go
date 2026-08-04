package exercise

import (
	"errors"
	"math"
	"testing"
)

const eps = 1e-9

func TestCircleImplementsShape(t *testing.T) {
	var s Shape = Circle{R: 2}
	if got, want := s.Area(), 4*math.Pi; math.Abs(got-want) > eps {
		t.Errorf("Circle{2}.Area() = %v, chci %v (π·r²)", got, want)
	}
	if got, want := s.Perimeter(), 4*math.Pi; math.Abs(got-want) > eps {
		t.Errorf("Circle{2}.Perimeter() = %v, chci %v (2·π·r)", got, want)
	}
}

func TestRectImplementsShape(t *testing.T) {
	var s Shape = Rect{W: 2, H: 3}
	if got, want := s.Area(), 6.0; math.Abs(got-want) > eps {
		t.Errorf("Rect{2,3}.Area() = %v, chci %v (w·h)", got, want)
	}
	if got, want := s.Perimeter(), 10.0; math.Abs(got-want) > eps {
		t.Errorf("Rect{2,3}.Perimeter() = %v, chci %v (2·(w+h))", got, want)
	}
}

func TestTotalArea(t *testing.T) {
	if got := TotalArea(nil); got != 0 {
		t.Errorf("TotalArea(nil) = %v, chci 0", got)
	}
	shapes := []Shape{Rect{W: 2, H: 3}, Rect{W: 1, H: 4}} // 6 + 4
	if got, want := TotalArea(shapes), 10.0; math.Abs(got-want) > eps {
		t.Errorf("TotalArea = %v, chci %v", got, want)
	}
}

func TestLargest(t *testing.T) {
	if _, ok := Largest(nil); ok {
		t.Error("Largest(nil) má vrátit ok=false")
	}

	small, big := Rect{W: 1, H: 1}, Rect{W: 5, H: 5}
	got, ok := Largest([]Shape{small, big, Rect{W: 2, H: 2}})
	if !ok {
		t.Fatal("Largest má vrátit ok=true pro neprázdný slice")
	}
	if got != Shape(big) {
		t.Errorf("Largest = %v, chci největší %v", got, big)
	}

	// Při shodě ploch vyhrává dřívější.
	a, b := Rect{W: 2, H: 2}, Rect{W: 4, H: 1} // obě plocha přesně 4
	got, _ = Largest([]Shape{a, b})
	if got != Shape(a) {
		t.Errorf("při shodě ploch chci první (%v), dostal jsem %v", a, got)
	}
}

func TestTallySatisfiesCounterAndKeepsState(t *testing.T) {
	var c Counter = &Tally{} // pointer — jaký receiver tedy Inc potřebuje?

	if got := c.Inc(); got != 1 {
		t.Fatalf("první Inc() = %d, chci 1", got)
	}
	if got := c.Inc(); got != 2 {
		t.Fatalf("druhý Inc() = %d, chci 2 — stav se ztrácí (mutuješ kopii?)", got)
	}
	if got := c.Inc(); got != 3 {
		t.Fatalf("třetí Inc() = %d, chci 3", got)
	}
}

func TestValidateReturnsErrorForNegative(t *testing.T) {
	err := Validate(-1)
	if err == nil {
		t.Fatal("Validate(-1) má vrátit chybu")
	}

	var ve *ValidationError
	if !errors.As(err, &ve) {
		t.Fatalf("chci *ValidationError, dostal jsem %T", err)
	}
	if ve.Field != "age" {
		t.Errorf("Field = %q, chci \"age\"", ve.Field)
	}
}

// 🧨 Test na typed nil — tady padá naprostá většina lidí.
func TestValidateReturnsUntypedNil(t *testing.T) {
	err := Validate(10)
	if err != nil {
		t.Fatalf("Validate(10) != nil — TYPED NIL!\n"+
			"  dynamický typ v interfacu: %T\n"+
			"  Vracíš proměnnou typu *ValidationError místo explicitního nil.\n"+
			"  Interface je nil, jen když jsou nil OBĚ složky (typ i hodnota).", err)
	}
}

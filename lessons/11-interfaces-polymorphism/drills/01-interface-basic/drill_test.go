package drill

import "testing"

func TestGreeters(t *testing.T) {
	// Když tohle projde kompilací, oba typy splňují Greeter.
	greeters := []Greeter{
		Czech{Name: "Olda"},
		English{Name: "Olda"},
	}

	want := []string{"Ahoj, Olda", "Hello, Olda"}
	for i, g := range greeters {
		if got := g.Greet(); got != want[i] {
			t.Errorf("%T.Greet() = %q, chci %q", g, got, want[i])
		}
	}
}

func TestGreeterIsInterface(t *testing.T) {
	var g Greeter = Czech{Name: "X"}
	if got := g.Greet(); got != "Ahoj, X" {
		t.Errorf("Greet() = %q, chci %q", got, "Ahoj, X")
	}
}

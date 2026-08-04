package drill

import "testing"

func TestTallyKeepsState(t *testing.T) {
	var c Counter = &Tally{} // pointer ⇒ jaký receiver metody potřebují?

	for i := 1; i <= 3; i++ {
		if got := c.Inc(); got != i {
			t.Fatalf("%d. Inc() = %d, chci %d\n"+
				"  (ztrácí se stav? mutuješ kopii — metoda potřebuje pointer receiver)", i, got, i)
		}
	}
}

func TestTallyReset(t *testing.T) {
	var c Counter = &Tally{}
	c.Inc()
	c.Inc()
	c.Reset()

	if got := c.Inc(); got != 1 {
		t.Errorf("po Reset() je Inc() = %d, chci 1", got)
	}
}

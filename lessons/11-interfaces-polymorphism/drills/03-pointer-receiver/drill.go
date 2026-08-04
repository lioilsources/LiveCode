// DRILL 03 — pointer receiver a mutace
//
// Napiš:
//
//  1. interface Counter s metodami Inc() int a Reset()
//  2. typ Tally, který si drží počet
//     - Inc() zvýší počet o 1 a vrátí NOVOU hodnotu
//     - Reset() vynuluje počet
//
// Musí platit: `var c Counter = &Tally{}` a stav se drží mezi voláními.
//
// Sval: rozpoznat, že mutující metoda potřebuje `func (t *Tally)`, ne `func (t Tally)`.
//
//	go test ./lessons/11-interfaces-polymorphism/drills/03-pointer-receiver/
package drill

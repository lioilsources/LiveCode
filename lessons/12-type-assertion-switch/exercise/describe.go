// Cvičení lekce 12 — zadání v README.md. Doplň TODO a spusť:
//
//	go test -race ./lessons/12-type-assertion-switch/exercise/
package exercise

import (
	"errors"
	"fmt"
)

// ── Zadané typy (needituj) ───────────────────────────────────────────────────

// ErrNotFound je sentinel chyba — matchuje se hodnotou.
var ErrNotFound = errors.New("not found")

// HTTPError je typovaná chyba nesoucí stavový kód.
type HTTPError struct{ Code int }

func (e *HTTPError) Error() string { return fmt.Sprintf("http error %d", e.Code) }

// ── 1. Describe ──────────────────────────────────────────────────────────────

// Describe vrátí popis dynamického typu v. Formáty viz README.md:
//
//	nil → "nil", int → "int:42", string → "string:5" (délka),
//	[]int → "slice:6" (součet), bool → "bool:true",
//	error → "error:msg", fmt.Stringer → "stringer:text",
//	jinak → "unknown:pkg.Type"
//
// Pozor na pořadí větví: error i fmt.Stringer jsou interfaces.
func Describe(v any) string {
	// TODO: implementuj type switch
	return ""
}

// ── 2. StatusCode ────────────────────────────────────────────────────────────

// StatusCode přeloží chybu na HTTP status. Chyby mohou být zabalené přes %w
// v několika vrstvách — přímé == a type assertion tedy nestačí.
//
//	nil                      → 200
//	*HTTPError kdekoli       → jeho Code   (má přednost)
//	ErrNotFound kdekoli      → 404
//	cokoli jiného            → 500
func StatusCode(err error) int {
	// TODO: implementuj přes errors.As / errors.Is
	return 0
}

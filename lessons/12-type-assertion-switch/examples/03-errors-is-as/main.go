// errors.Is / errors.As — skutečný "pattern matching" v Go.
// Ukazuje, proč == a type assertion selžou, jakmile je chyba zabalená.
package main

import (
	"errors"
	"fmt"
)

// Sentinel error — porovnává se HODNOTA.
var ErrNotFound = errors.New("not found")

// Typovaná chyba — nese data.
type HTTPError struct{ Code int }

func (e *HTTPError) Error() string { return fmt.Sprintf("http error %d", e.Code) }

// Simulace vrstev aplikace: každá vrstva chybu zabalí přes %w.
func db() error      { return ErrNotFound }
func repo() error    { return fmt.Errorf("repo.GetUser(42): %w", db()) }
func service() error { return fmt.Errorf("service.Profile: %w", repo()) }

func apiCall() error {
	return fmt.Errorf("api: %w", &HTTPError{Code: 503})
}

func main() {
	err := service()
	fmt.Println("chyba:", err)
	fmt.Println()

	// ── Sentinel: == vs errors.Is ────────────────────────────────────────────
	fmt.Println("── hledám ErrNotFound ──")
	fmt.Printf("err == ErrNotFound        → %v  ❌ (vidí jen vrchní vrstvu)\n", err == ErrNotFound)
	fmt.Printf("errors.Is(err, NotFound)  → %v  ✅ (rozbalí celý řetěz)\n", errors.Is(err, ErrNotFound))

	// ── Typ: assertion vs errors.As ──────────────────────────────────────────
	err = apiCall()
	fmt.Println("\n── hledám *HTTPError ──")
	fmt.Println("chyba:", err)

	_, ok := err.(*HTTPError)
	fmt.Printf("err.(*HTTPError)          → ok=%v  ❌ (vrchní vrstva je *fmt.wrapError)\n", ok)

	var he *HTTPError
	if errors.As(err, &he) { // ⚠️ POINTER na proměnnou! &he, ne he
		fmt.Printf("errors.As(err, &he)       → ok=true ✅ a mám data: Code=%d\n", he.Code)
	}

	// ── Rozbalení řetězu ─────────────────────────────────────────────────────
	fmt.Println("\n── řetěz zabalení (Unwrap) ──")
	for e, i := service(), 0; e != nil; e, i = errors.Unwrap(e), i+1 {
		fmt.Printf("  %d: %-45s (%T)\n", i, e, e)
	}

	fmt.Println("\nPravidlo: Is = hodnota (sentinel), As = typ (+ data z chyby).")
}

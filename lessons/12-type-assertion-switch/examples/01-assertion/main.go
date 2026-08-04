// Type assertion: jednohodnotová forma panikaří, comma-ok nikdy.
// Bonus: assertion na INTERFACE = capability detection.
package main

import (
	"fmt"
	"io"
	"strings"
)

func main() {
	var x any = "hello"

	// ✅ comma-ok — bezpečné
	if s, ok := x.(string); ok {
		fmt.Printf("je to string: %q (délka %d)\n", s, len(s))
	}
	n, ok := x.(int)
	fmt.Printf("x.(int) přes comma-ok → n=%d, ok=%v (žádná panika)\n", n, ok)

	// 💥 jednohodnotová forma na špatný typ = panic (zachytíme, ať program doběhne)
	func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Println("💥 zachycená panika:", r)
			}
		}()
		_ = x.(int) // interface conversion: interface {} is string, not int
	}()

	capabilityDetection()
}

// Assertovat lze i na INTERFACE — „umí ta věc navíc tohle?"
func capabilityDetection() {
	fmt.Println("\n── capability detection ──")

	// strings.Reader NEumí Close, io.NopCloser ho obalí a Close přidá.
	plain := strings.NewReader("data")
	closer := io.NopCloser(strings.NewReader("data"))

	for name, r := range map[string]io.Reader{"strings.Reader": plain, "NopCloser": closer} {
		if c, ok := r.(io.Closer); ok {
			_ = c.Close()
			fmt.Printf("%-15s umí io.Closer → zavřeno\n", name)
		} else {
			fmt.Printf("%-15s io.Closer neumí → přeskakuji\n", name)
		}
	}

	fmt.Println("\nPřesně takhle to dělá stdlib: ResponseWriter → http.Flusher,")
	fmt.Println("io.Copy → io.WriterTo. Nezvětšuje interface, jen se doptá.")
}

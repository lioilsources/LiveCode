// Type switch: v každé větvi má proměnná jiný konkrétní typ.
// Pasti: více typů v jedné větvi, pořadí větví, case nil.
package main

import "fmt"

type Temp float64

func (t Temp) String() string { return fmt.Sprintf("%.1f°C", float64(t)) }

func describe(v any) string {
	switch t := v.(type) {
	case nil:
		return "nil (žádný typ ani hodnota)"

	case int:
		return fmt.Sprintf("int, +1 = %d", t+1) // t je int → můžu počítat

	case string:
		return fmt.Sprintf("string délky %d", len(t)) // t je string → len()

	case []int:
		sum := 0
		for _, n := range t {
			sum += n
		}
		return fmt.Sprintf("[]int, součet %d", sum)

	// ⚠️ PAST: ve větvi s VÍCE typy zůstává t typu `any`!
	case float32, float64:
		// return t * 2  // ← nezkompiluje se: invalid operation (t je any)
		return fmt.Sprintf("nějaký float (%T) — t je tu any, ne float", t)

	// ⚠️ Pořadí: fmt.Stringer je interface. Kdyby byl NAD `case int`,
	// chytal by všechno, co má String() — konkrétní větve by se minuly.
	case fmt.Stringer:
		return "Stringer → " + t.String()

	default:
		return fmt.Sprintf("nepokrytý typ %T ⚠️ (kompilátor úplnost NEhlídá!)", t)
	}
}

func main() {
	for _, v := range []any{
		nil,
		42,
		"hello",
		[]int{1, 2, 3},
		3.14,
		Temp(21.5),
		struct{ A int }{1}, // spadne do default
	} {
		fmt.Printf("%-22v → %s\n", fmt.Sprintf("%#v", v), describe(v))
	}
}

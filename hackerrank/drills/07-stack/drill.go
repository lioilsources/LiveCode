// DRILL 07 — zásobník na slice
//
// Napiš:
//
//	func Balanced(s string) bool
//
// s obsahuje jen znaky ()[]{}. Vrať true, když jsou závorky správně
// uzávorkované a vnořené: "([]{})" ano, "([)]" ne, "((" ne, ")" ne, "" ano.
//
// Sval: stack := []byte{}; push = append; pop = stack[:len-1] — a nikdy
// nepopovat prázdný stack. Mapa uzavírací → otevírací šetří if-y.
//
//	go test ./hackerrank/drills/07-stack/
package drill

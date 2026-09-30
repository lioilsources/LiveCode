// DRILL 06 — řazení podle víc klíčů
//
// Napiš:
//
//	type Player struct {
//		Name  string
//		Score int
//	}
//	func Rank(players []Player) []Player
//
// Vrať NOVÝ slice seřazený podle Score sestupně; při stejném Score podle
// Name vzestupně (lexikograficky). Vstupní slice zůstane nezměněný.
//
// Sval: sort.Slice s „if primární != primární { return … }; return sekundární"
// a vědomí, že sort.Slice řadí IN PLACE — když vstup nesmíš mutovat, zkopíruj.
//
//	go test ./hackerrank/drills/06-sort-multikey/
package drill

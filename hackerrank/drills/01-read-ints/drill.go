// DRILL 01 — čtení vstupu ve formátu HackerRanku
//
// Napiš:
//
//	func ReadInts(r io.Reader) ([]int, error)
//
// Vstup: první token je n, následuje n celých čísel oddělených libovolným
// whitespace (mezery, \n, \r\n — nezáleží na tom, jak jsou rozložená do řádků).
// Vrať načtená čísla. Pro n = 0 vrať prázdný (ne nil) slice.
// Chyba: méně než n čísel, nebo token není číslo.
//
// Sval: bufio.Scanner + Split(bufio.ScanWords) + strconv.Atoi.
// Bez fmt.Fscan — na 10^6 číslech je pomalý.
//
//	go test ./hackerrank/drills/01-read-ints/
package drill

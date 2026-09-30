// DRILL 02 — mapa jako čítač
//
// Napiš:
//
//	func MostFrequent(nums []int) int
//
// Vrať hodnotu, která se v nums vyskytuje nejčastěji. Při shodě četností
// vrať NEJMENŠÍ takovou hodnotu. nums je neprázdné.
//
// Sval: map[int]int{} jako čítač (chybějící klíč = 0), jeden průchod na
// výběr vítěze s tie-breakem. Pozor: iterace mapy má náhodné pořadí —
// tie-break musí být v podmínce, ne „první nalezený".
//
//	go test ./hackerrank/drills/02-count-freq/
package drill

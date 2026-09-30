// DRILL 08 — BFS na mřížce
//
// Napiš:
//
//	func ShortestPath(grid []string) int
//
// grid je obdélníková mřížka znaků: '.' volno, '#' zeď, 'S' start, 'E' cíl
// (každý právě jednou). Pohyb o 1 políčko ve 4 směrech. Vrať počet kroků
// nejkratší cesty S → E, nebo -1, když cesta neexistuje.
//
// Sval: fronta jako slice (queue[0], queue = queue[1:]), tabulka dist
// inicializovaná na -1 (slouží i jako visited), pole směrů dr/dc, kontrola
// hranic PŘED přístupem do gridu. Žádná rekurze — na 1000×1000 by
// přetekl zásobník.
//
//	go test ./hackerrank/drills/08-bfs-grid/
package drill

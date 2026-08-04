// DRILL 02 — polymorfní funkce nad []Interface
//
// Napiš:
//
//  1. interface Shape s metodou Area() float64
//  2. typ Square{Side float64}       → Area = Side*Side
//  3. typ Rect{W, H float64}         → Area = W*H
//  4. func TotalArea(shapes []Shape) float64   — součet; prázdný → 0
//  5. func BiggestArea(shapes []Shape) float64 — největší; prázdný → 0
//
// Sval: přijmout []Interface, iterovat, volat metodu, nesahat na konkrétní typy.
//
//	go test ./lessons/11-interfaces-polymorphism/drills/02-polymorphic-fn/
package drill

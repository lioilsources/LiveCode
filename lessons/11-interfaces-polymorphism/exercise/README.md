# Exercise 11 — Shapes, method sets a typed nil

**Časový limit: ~20 minut**

Implementuj v `shapes.go` (kostra tam je, doplň `TODO`).

## 1. Interface `Shape` + dvě implementace

- `Shape` má `Area() float64` a `Perimeter() float64`.
- `Circle{R float64}` a `Rect{W, H float64}` ho splňují.
- Přidej **compile-time kontrolu** `var _ Shape = ...` pro oba typy.

## 2. Polymorfní funkce

- `TotalArea(shapes []Shape) float64` — součet ploch. Prázdný slice → `0`.
- `Largest(shapes []Shape) (Shape, bool)` — tvar s největší plochou.
  Prázdný slice → `(nil, false)`. Při shodě vrať ten dřívější.

## 3. Method set — `Tally`

- `Tally` počítá zavolání. Splňuje `Counter` (metoda `Inc() int`, vrací nový stav).
- Musí jít použít jako `var c Counter = &Tally{}` a **stav se musí držet**
  mezi voláními (tj. mutace se nesmí ztratit v kopii).
- Rozmysli si, jaký receiver metoda potřebuje — a proč ten druhý nefunguje.

## 4. Typed nil — `Validate`

- `Validate(age int) error`:
  - `age < 0` → vrátí `*ValidationError{Field: "age", Msg: "must not be negative"}`
  - jinak → **musí vrátit nil tak, aby `err == nil` bylo `true`** 🧨

  Test tohle explicitně kontroluje. Pozor na past z examples/03.

## Spuštění testů

```bash
go test -race ./lessons/11-interfaces-polymorphism/exercise/
```

ℹ️ Dokud metody nedoplníš, testy se **nezkompilují** — a ta první hláška od
kompilátoru (`Circle does not implement Shape…`) je součást zadání. Přečti si ji
pořádně, na pohovoru ji budeš číst taky.

## Pravidla hry

- Piš sám, LESSON.md si otevři až po pokusu (nebo když fakt nevíš kudy).
- Hlášky testů jsou psané jako nápověda — čti je.
- Review pak projdeme jako na pohovoru: nejdřív se ptám já.

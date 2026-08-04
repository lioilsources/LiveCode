# Exercise 13 — Generika

**Časový limit: ~25 minut**

Implementuj v `generics.go` (kostra + `TODO`).

## 1. Slice utility

- `MapSlice[T, U any](s []T, f func(T) U) []U` — transformace. `nil` → prázdný slice.
- `Filter[T any](s []T, keep func(T) bool) []T` — filtr. `nil` → prázdný slice.

## 2. Mapy a constraints

- `SortedKeys[K ?, V any](m map[K]V) []K` — klíče **seřazené vzestupně**.
  Rozmysli si, jaký constraint `K` potřebuje: `comparable` stačí na klíč mapy,
  ale na řazení potřebuješ víc.

## 3. `var zero T`

- `MaxOf[T ?](s []T) (T, bool)` — největší prvek.
  Prázdný/`nil` slice → **nulová hodnota `T`** a `false`.

## 4. Vlnovka `~`

- `Sum[T Number](s []T) T` — součet. `Number` je constraint, který **musí projít
  i pro pojmenované typy** jako `type Celsius float64`.
  Doplň definici `Number` — testy ji zkouší s `Celsius`.

## 5. Generický typ `Stack[T]`

- `Push(v T)`, `Len() int`
- `Pop() (T, bool)` — LIFO; z prázdného zásobníku → nulová hodnota + `false`
- `NewStack[T any]() *Stack[T]`

## Spuštění testů

```bash
go test -race ./lessons/13-generics/exercise/
```

## Pravidla hry

- Nejdřív sám. Když constraint nesedí, přečti si chybu kompilátoru — u generik
  je nezvykle upovídaná a obvykle přímo napoví (`possibly missing ~`).

# Exercise 12 — Type switch a matchování chyb

**Časový limit: ~20 minut**

Implementuj v `describe.go` (kostra + `TODO`).

## 1. `Describe(v any) string` — type switch

Vrať přesně tyhle řetězce:

| Vstup | Výstup |
|---|---|
| `nil` | `"nil"` |
| `int` | `"int:42"` (hodnota) |
| `string` | `"string:5"` (délka) |
| `[]int` | `"slice:6"` (**součet** prvků) |
| `bool` | `"bool:true"` / `"bool:false"` |
| typ s `Error() string` | `"error:<zpráva>"` |
| typ s `String() string` | `"stringer:<text>"` |
| cokoli jiného | `"unknown:main.Foo"` (tj. `%T`) |

⚠️ Rozmysli si **pořadí větví** — `error` i `fmt.Stringer` jsou interfaces a chytí
hodně věcí. Testy mají případ, který splňuje **oba** (musí vyhrát `error`).

## 2. `StatusCode(err error) int` — Is vs. As

Chyby přicházejí **zabalené** přes `%w` (klidně několik vrstev). Vrať:

| Situace | Kód |
|---|---|
| `err == nil` | `200` |
| kdekoli v řetězu je `*HTTPError` | jeho `.Code` |
| kdekoli v řetězu je `ErrNotFound` | `404` |
| cokoli jiného | `500` |

`*HTTPError` má přednost před `ErrNotFound`.

💡 Přímé `err == ErrNotFound` ani `err.(*HTTPError)` **neprojdou** — testy chyby balí.

## Spuštění testů

```bash
go test -race ./lessons/12-type-assertion-switch/exercise/
```

## Pravidla hry

- Nejdřív sám, LESSON.md až po pokusu.
- U `errors.As` pozor na to, co mu předáváš — špatný argument = runtime panic.

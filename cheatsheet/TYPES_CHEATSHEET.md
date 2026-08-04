# Cheatsheet — typový systém (lekce 11–13)

Rychlá připomínka před pohovorem. Vzory, které máš umět naslepo.

## Interfaces

```go
type Shape interface{ Area() float64 }        // malý interface, 1 metoda
var _ Shape = (*Circle)(nil)                  // compile-time kontrola splnění
```

- Splnění je **implicitní** — žádné `implements`.
- Interface definuje **konzument**, ne implementace.
- *„Accept interfaces, return structs."*
- Embedding = **složení a delegace**, ne dědičnost.

### Method sets ⚠️

| Receiver | `T` splňuje? | `*T` splňuje? |
|---|---|---|
| `func (t T) M()` | ✅ | ✅ |
| `func (t *T) M()` | ❌ | ✅ |

> Pointer receiver ⇒ interface splňuje **jen pointer**.

### Typed nil 🧨

```go
var e *MyErr          // nil pointer
return e              // ❌ interface = (typ=*MyErr, val=nil) ⇒ != nil
return nil            // ✅
```

> Interface je nil, jen když jsou nil **obě** složky (typ i hodnota).

## Type assertion & switch

```go
v, ok := x.(T)        // ✅ nikdy nepanikaří
v := x.(T)            // 💥 panic při neshodě

if c, ok := r.(io.Closer); ok { c.Close() }   // capability detection
```

```go
switch t := v.(type) {
case nil:            // …
case int:            // t je int
case int64, float64: // ⚠️ t je tady ANY (víc typů ⇒ původní interface typ)
case error:          // interface — pozor na POŘADÍ větví
default:             // ⚠️ vždy měj: kompilátor úplnost NEhlídá
}
```

## Chyby — Is vs. As ⭐

```go
fmt.Errorf("kontext: %w", err)                // wrap

errors.Is(err, ErrNotFound)                   // HODNOTA (sentinel)
var he *HTTPError; errors.As(err, &he)        // TYP + data  (&he, ne he!)
```

> `==` a type assertion vidí jen vrchní vrstvu. Po zabalení přestanou fungovat.

## Generika

```go
func MapSlice[T, U any](s []T, f func(T) U) []U
func MaxOf[T cmp.Ordered](a, b T) T
func Keys[K comparable, V any](m map[K]V) []K

type Number interface{ ~int | ~float64 }      // ~ = "a typy s tímhle základem"

var zero T                                    // jediný způsob nulové hodnoty
```

- Metody **nesmí** mít vlastní type parametry → udělej volnou funkci.
- **Žádná kovariance**: `[]Dog` není `[]Animal`.
- Stdlib: `slices`, `maps`, `cmp` (1.21+).

### Generika vs. interfaces

| Generika | Interfaces |
|---|---|
| **stejná logika**, různé typy | **různé chování** za rozhraním |
| kontejnery, utility | polymorfismus |
| compile time | runtime dispatch |

> Anti-pattern: `func F[T any](v T)` s type switchem na `T` → má to být interface.

## Věty na pohovor

- „Interface hodnota je pár (typ, hodnota); je nil jen když jsou nil obě."
- „Pointer receiver znamená, že interface splní jen pointer — jinak by se mutace ztratila v kopii."
- „Chyby matchuju přes `errors.Is`/`As`, ne přes `==` — jinak to spadne, jakmile je někdo zabalí."
- „Generika když se mění typ, interface když se mění chování."

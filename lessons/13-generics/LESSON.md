# Lekce 13 — Generika

> Generika jsou v Go od 1.18. Na pohovoru se neptají „umíš je napsat", ale
> **„kdy je použiješ místo interfacu"** — a tam padá většina lidí.

## 1. Proč vůbec

Před generikami jsi měl dvě špatné volby:

```go
// (a) any + type assertion → ztráta typové bezpečnosti, runtime panic, alokace
func Max(a, b any) any { ... }

// (b) copy-paste pro každý typ → MaxInt, MaxFloat64, MaxString...
```

Generika = **jeden kód, mnoho typů, kontrola při kompilaci**.

```go
func MapSlice[T, U any](s []T, f func(T) U) []U {
    out := make([]U, 0, len(s))
    for _, v := range s {
        out = append(out, f(v))
    }
    return out
}

names := MapSlice([]int{1, 2, 3}, func(n int) string { ... })  // []string
```

**Type inference:** `MapSlice[int, string](...)` psát nemusíš — kompilátor si typy
odvodí z argumentů. Explicitně je uvádíš, jen když odvodit nejdou (typicky když se
typ objevuje pouze v návratové hodnotě).

## 2. Constraints — co smí za `T` přijít

Constraint je **interface použitý jako množina typů**.

| Constraint | Znamená | Umožní |
|---|---|---|
| `any` | cokoli | jen předávat, přiřazovat |
| `comparable` | typy s `==` a `!=` | porovnání, **klíč v mapě** |
| `cmp.Ordered` (stdlib `cmp`) | čísla + stringy | `<`, `>`, `<=`, `>=` |
| vlastní union | `~int \| ~float64` | operace platné pro všechny členy |
| interface s metodami | typy s těmi metodami | volat ty metody |

```go
import "cmp"

func MaxOf[T cmp.Ordered](a, b T) T {   // < a > fungují
    if a > b { return a }
    return b
}

func Keys[K comparable, V any](m map[K]V) []K {  // K musí být klíčovatelný
    ...
}
```

### Vlnovka `~` — „a typy s tímhle základem"

```go
type Celsius float64          // vlastní typ se základem float64

type Number interface{ ~int | ~float64 }   // s vlnovkou
type NumberNoTilde interface{ int | float64 }

func Sum[T Number](xs []T) T { ... }

Sum([]Celsius{1, 2})   // ✅ s ~ projde  ❌ bez ~ neprojde
```

**`~int` = „int a všechny typy, jejichž underlying type je int".** Bez vlnovky
propadnou všechny tvoje pojmenované typy. Na pohovoru je vlnovka oblíbená chytačka.

## 3. Generické typy (struktury)

```go
type Stack[T any] struct {
    items []T
}

func NewStack[T any]() *Stack[T] { return &Stack[T]{} }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T          // ⚠️ takhle se dělá nulová hodnota generického typu
        return zero, false  // (nemůžeš napsat return nil / return 0)
    }
    v := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return v, true
}
```

Dvě věci k zapamatování:
- **`var zero T`** je jediný způsob, jak vyrobit nulovou hodnotu (`nil`/`0`/`""` podle typu).
- V metodách se **type parametr opakuje na receiveru**: `func (s *Stack[T]) …`

### 🧨 Metody nemohou mít vlastní type parametry

```go
func (s *Stack[T]) MapTo[U any](f func(T) U) *Stack[U]   // ❌ NEZKOMPILUJE SE
```

Go tohle nedovoluje (metoda nesmí přidat nový type param). Řešení: **volná funkce**.

```go
func MapStack[T, U any](s *Stack[T], f func(T) U) *Stack[U]  // ✅
```

Proto ve stdlib najdeš `slices.Map`-like věci jako funkce, ne metody.

## 4. ⭐ Generika vs. interfaces — rozhodovací tabulka

Tohle je ta interview otázka.

| | **Generika** | **Interfaces** |
|---|---|---|
| Otázka | „**stejná logika** pro různé typy" | „**různé chování** za společným rozhraním" |
| Kdy | kontejnery, utility (`Map`, `Filter`, `Stack`) | polymorfismus (`Shape.Area`, `io.Writer`) |
| Kdy se rozhodne | **compile time** (monomorfizace/slovníky) | **runtime** (dynamický dispatch) |
| Typová bezpečnost | plná, bez assertion | uvnitř ztrácíš konkrétní typ |
| Cena | žádný boxing | nepřímé volání, možná alokace |

**Zkratka:** *Potřebuju znát a vracet konkrétní typ volajícího?* → generika.
*Potřebuju volat chování, které si každý typ dělá po svém?* → interface.

```go
// Generika: logika je pro všechny stejná, jen typ se mění
func First[T any](s []T) (T, bool)

// Interface: chování je pro každý typ jiné
type Shape interface{ Area() float64 }
```

**Anti-pattern:** `func Process[T any](v T)`, kde uvnitř děláš type switch na `T`.
To má být interface, ne generika.

## 5. Limity, na které narazíš

- **Žádná kovariance:** `[]Dog` **není** `[]Animal`, i když `Dog` splňuje `Animal`.
  Musíš převádět prvek po prvku.
- **Žádná specializace** (jako C++ template specialization) ani přetěžování.
- **Nelze** type-switchovat přímo na `T`; musíš přes `any(v)`.
- Generický kód umí být **hůř čitelný** — pokud řešíš jen dva typy, dvě funkce
  bývají lepší než jedna generická. *„A little copying is better than a little
  dependency."*

## 6. Stdlib, kterou máš znát (1.21+)

```go
import ("slices"; "maps"; "cmp")

slices.Contains(s, v)      slices.Index(s, v)      slices.Sort(s)
slices.SortFunc(s, cmp)    slices.Max(s)           slices.Reverse(s)
maps.Keys(m)               maps.Values(m)          // vracejí iterátory (1.23+)
cmp.Ordered                cmp.Compare(a, b)
```

Zmínit `slices`/`maps` na pohovoru je levný bod — ukazuje, že sleduješ moderní Go.

## Examples

| Soubor | Ukazuje |
|---|---|
| `examples/01-type-params/` | `MapSlice`/`Filter`/`Reduce`, inference, kdy typ psát explicitně |
| `examples/02-constraints/` | `comparable`, `cmp.Ordered`, union, **vlnovka `~`** naživo |
| `examples/03-generic-types/` | `Stack[T]`, `var zero T`, proč metoda nemůže mít vlastní type param |

Spuštění: `go run ./lessons/13-generics/examples/02-constraints/`

## Exercise

`exercise/` — zadání v `exercise/README.md`.
Testy: `go test -race ./lessons/13-generics/exercise/`

## Kontrolní otázky

1. Kdy sáhneš po generikách a kdy po interfacu? Dej příklad na obojí.
2. Co dělá `~` v `type Number interface{ ~int | ~float64 }` a co se pokazí bez ní?
3. Jak v generické funkci vrátíš „nulovou hodnotu" typu `T`? Proč nejde `return nil`?

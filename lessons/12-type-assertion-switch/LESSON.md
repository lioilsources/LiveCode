# Lekce 12 — Type assertion & type switch („pattern matching" v Go)

> Go nemá pattern matching jako Rust/Scala. Má **type assertion**, **type switch**
> a — pro chyby — **`errors.Is` / `errors.As`**. Ta poslední dvojice je na pohovoru
> nejcennější, protože 90 % reálného „matchování" v Go se děje na chybách.

## 1. Type assertion — dvě formy, jedna z nich panikaří

Interface drží pár `(typ, hodnota)` (lekce 11). Type assertion je otázka:
*„je uvnitř zrovna tenhle konkrétní typ?"*

```go
var x any = "hello"

s := x.(string)      // ✅ "hello"
n := x.(int)         // 💥 panic: interface conversion: interface {} is string, not int

s, ok := x.(string)  // ✅ "hello", true
n, ok := x.(int)     // ✅ 0, false  — ŽÁDNÁ panika, jen nulová hodnota + false
```

**Pravidlo:** jednohodnotová forma **panikaří**, comma-ok forma **nikdy**.
V produkčním kódu piš comma-ok, pokud nemáš 100% jistotu (a i tak radši comma-ok).

⚠️ Assertovat lze **jen na interface hodnotu**. `nějakýString.(int)` se ani nezkompiluje —
kompilátor typ zná, není co zjišťovat.

### Assertion na *interface*, ne jen na konkrétní typ

Tohle je silný a málo známý vzor: **capability detection** — „umí ta věc navíc tohle?"

```go
func process(r io.Reader) error {
    // ... čti ...
    if c, ok := r.(io.Closer); ok {   // umí se zavřít? tak zavři
        return c.Close()
    }
    return nil
}
```

Přesně tak funguje stdlib: `http.ResponseWriter` si otestuješ na `http.Flusher`,
`io.Copy` si zdroj otestuje na `io.WriterTo`. Na pohovoru je to signál, že interfaces
chápeš do hloubky.

## 2. Type switch — větvení podle typu

```go
func describe(v any) string {
    switch t := v.(type) {
    case nil:                          // pozor: case nil, ne case any(nil)
        return "nic"
    case int:
        return fmt.Sprintf("int %d", t+1)      // t je int, můžu počítat
    case string:
        return fmt.Sprintf("string délky %d", len(t)) // t je string
    case []int:
        return fmt.Sprintf("slice %d prvků", len(t))
    case error:                        // interface! chytí cokoli s Error()
        return "chyba: " + t.Error()
    case fmt.Stringer:                 // taky interface
        return "stringer: " + t.String()
    default:
        return fmt.Sprintf("neznámý typ %T", t)
    }
}
```

Tři věci, na které se ptají:

1. **`t` má v každé větvi jiný, konkrétní typ** — v `case int` je `int`, v `case string`
   je `string`. To je celé kouzlo type switche.
2. **Ve větvi s více typy zůstává `t` původního interface typu:**
   ```go
   case int, int64:
       // t je tady ANY, ne int! Nemůžeš t+1 — musíš assertovat znovu.
   ```
3. **Pořadí rozhoduje.** Větve se zkoušejí shora dolů. Když dáš `case error` nad
   `case *MyErr`, konkrétní větev se nikdy nechytne.

### 🧨 Kompilátor NEhlídá úplnost

Na rozdíl od Rustu Go **nezkontroluje**, že jsi pokryl všechny možnosti. Přidáš nový
typ, zapomeneš větev → tiše propadne do `default` (nebo neudělá nic). **Vždy měj
`default`**, minimálně s logem/chybou.

### Kdy je type switch code smell

Když větvíš podle **svých vlastních** typů, obvykle to znamená, že místo toho měla být
metoda na interfacu (polymorfismus — lekce 11):

```go
// ŠPATNĚ                                  // SPRÁVNĚ
switch s := shape.(type) {                 type Shape interface{ Area() float64 }
case Circle: return math.Pi*s.R*s.R        // a prostě: shape.Area()
case Rect:   return s.W * s.H
}
```

**Legitimní** použití type switche: dekódování `any` (JSON), zpracování chyb, AST/vizitor,
práce s cizími typy, které nemůžeš změnit.

## 3. `errors.Is` a `errors.As` — skutečný pattern matching v Go ⭐

Chyby se **wrapují** přes `%w`, čímž vzniká řetěz. Matchuje se skrz celý řetěz:

```go
if err != nil {
    return fmt.Errorf("načtení uživatele %d: %w", id, err)  // %w = wrap
}
```

| Chceš | Použij | Ptá se |
|---|---|---|
| konkrétní **hodnotu** (sentinel) | `errors.Is(err, target)` | „je někde v řetězu **tahle** chyba?" |
| konkrétní **typ** (a data z něj) | `errors.As(err, &target)` | „je někde v řetězu chyba **tohohle typu**?" |

```go
// Sentinel — porovnání hodnoty
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) { /* 404 */ }

// Typ + data z chyby
type HTTPError struct{ Code int }
func (e *HTTPError) Error() string { return fmt.Sprintf("http %d", e.Code) }

var he *HTTPError
if errors.As(err, &he) {
    log.Println("status byl", he.Code)   // ✅ mám přístup k datům chyby
}
```

**Proč ne `err == ErrNotFound` a `err.(*HTTPError)`?** Protože ty projdou jen **vrchní**
vrstvu. Jakmile chybu někdo zabalí do `fmt.Errorf("...: %w", err)`, přímé porovnání
i assertion **přestanou fungovat**. `Is`/`As` rozbalují řetěz.

⚠️ `errors.As` bere **pointer na proměnnou** cílového typu (`&he`, kde `he` je `*HTTPError`).
Když tam dáš `he`, dostaneš runtime panic. Klasická chyba na pohovoru.

> Věta na pohovor: **„Chyby porovnávám přes `errors.Is`/`As`, ne přes `==` a type
> assertion — jinak mi to přestane fungovat, jakmile chybu někdo zabalí."**

## 4. Sealed interface — náhrada sum typů

Go nemá `enum`/sum typy. Dá se ale vyrobit **uzavřená** rodina typů: interface
s **neexportovanou** metodou. Mimo balík ji nikdo neimplementuje.

```go
type Event interface {
    isEvent()   // neexportovaná ⇒ implementovat lze jen uvnitř tohohle balíku
}

type Created struct{ ID string }
type Deleted struct{ ID string; Reason string }

func (Created) isEvent() {}
func (Deleted) isEvent() {}

// Type switch nad Event je teď „skoro vyčerpávající" — mimo balík nikdo nepřidá typ.
```

## Examples

| Soubor | Ukazuje |
|---|---|
| `examples/01-assertion/` | panika vs. comma-ok, capability detection přes `io.Closer` |
| `examples/02-type-switch/` | větvení, past s více typy v jedné větvi, pořadí větví, `case nil` |
| `examples/03-errors-is-as/` | wrap přes `%w`, proč `==` a assertion selžou, `Is` vs `As` |

Spuštění: `go run ./lessons/12-type-assertion-switch/examples/03-errors-is-as/`

## Exercise

`exercise/` — zadání v `exercise/README.md`.
Testy: `go test -race ./lessons/12-type-assertion-switch/exercise/`

## Kontrolní otázky

1. Jaký je rozdíl mezi `v := x.(T)` a `v, ok := x.(T)`? Kdy použiješ kterou?
2. V `case int, int64:` — jakého typu je proměnná ze `switch t := v.(type)`? Proč?
3. Funkce vrátí `fmt.Errorf("ctx: %w", ErrNotFound)`. Proč `err == ErrNotFound`
   nefunguje a co použiješ místo toho? A jaký je rozdíl mezi `Is` a `As`?

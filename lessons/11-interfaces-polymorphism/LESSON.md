# Lekce 11 — Interfaces & polymorfismus

> Go nemá dědičnost, `extends`, ani `implements`. Polymorfismus se dělá **výhradně
> přes interfaces** — a funguje jinak než v Javě/C#. Když to čekáš jako Javu,
> na pohovoru se ztratíš. Tahle lekce dává pravidla, ne intuici.

## 1. Implicitní splnění — „zásuvka, ne rodokmen"

V Javě řekneš `class Circle implements Shape`. **V Go nic takového neexistuje.**
Typ splňuje interface tím, že **má ty metody**. Tečka. Nikde se to nedeklaruje.

```go
type Shape interface {
    Area() float64
}

type Circle struct{ R float64 }

func (c Circle) Area() float64 { return math.Pi * c.R * c.R }
// Hotovo. Circle JE Shape. Nikde jsme to neřekli.
```

**Analogie:** interface je **zásuvka**, ne rodokmen. Nezajímá ji, kdo je tvůj předek —
zajímá ji, jestli máš správné kolíky. Cokoli s `Area() float64` do té zásuvky pasuje.

### Důsledek, který se ptají na pohovoru

Interface můžeš definovat **až potom**, co typ existuje — klidně pro cizí typ z knihovny,
kterou needituješ. Proto platí idiom:

> **Interface definuje ten, kdo ho konzumuje, ne ten, kdo ho implementuje.**

V Javě jde interface k implementaci. V Go jde **k volajícímu**. Balík, který data
používá, si řekne, co potřebuje; balík, který typ poskytuje, o interfacu nemusí vědět.

```go
// ŠPATNĚ (javovsky): balík storage exportuje interface pro svoje typy
package storage
type Store interface { Get(id string) ([]byte, error); Put(...); Delete(...); List(...) }

// SPRÁVNĚ (go-idiomaticky): consumer si řekne o minimum, co potřebuje
package report
type getter interface { Get(id string) ([]byte, error) }  // stačí mi Get!
func Build(g getter) error { ... }
```

### Malé interfaces

> *„The bigger the interface, the weaker the abstraction."* — Rob Pike

Nejpoužívanější interfaces ve stdlib mají **jednu metodu**: `io.Reader`, `io.Writer`,
`error`, `fmt.Stringer`, `sort.Interface` (ta má tři). Když píšeš interface s osmi
metodami, děláš to skoro jistě špatně — nikdo jiný ho nesplní a nemockuješ ho.

**Pravidlo palce na pohovoru:** *„Accept interfaces, return structs."* Funkce bere
interface (flexibilita pro volajícího), ale vrací konkrétní typ (volající pak vidí
všechny metody, ne jen ořezané rozhraní).

## 2. Method sets — pointer vs. value receiver ⚠️

**Tohle je nejčastější interview otázka z celé lekce** a nejčastější důvod záhadné
chyby `X does not implement Y`.

Pravidlo:

| Receiver metody | Splňuje interface `T`? | Splňuje interface `*T`? |
|---|---|---|
| `func (t T) M()`  | ✅ ano | ✅ ano |
| `func (t *T) M()` | ❌ **NE** | ✅ ano |

Slovy: **pointer receiver ⇒ interface splňuje jen pointer.** Hodnota ne.

```go
type Speaker interface{ Speak() string }

type Dog struct{}
func (d Dog) Speak() string { return "woof" }   // value receiver

type Cat struct{}
func (c *Cat) Speak() string { return "meow" }  // POINTER receiver

var s Speaker
s = Dog{}    // ✅ OK
s = &Dog{}   // ✅ OK — pointer má i value metody
s = &Cat{}   // ✅ OK
s = Cat{}    // ❌ COMPILE ERROR: Cat does not implement Speaker
             //    (method Speak has pointer receiver)
```

**Proč to tak je?** Kdyby `Cat{}` (hodnota) splňovala interface, metoda s pointer
receiverem by dostala adresu **kopie** uložené v interfacu — mutace by se ztratila.
Go tenhle tichý bug nedovolí: raději to neposkytne vůbec.

**Praktické pravidlo:** má-li **jakákoli** metoda typu pointer receiver, dej ho
**všem** metodám a všude pracuj s `*T`. Míchání je zdroj těchhle chyb.

### Compile-time kontrola

Chceš mít jistotu, že typ splňuje interface, i když ho zrovna nikam nepředáváš?

```go
var _ Shape = (*Circle)(nil)   // nic nestojí, spadne při kompilaci, ne až v runtime
```

Tenhle řádek se dává do balíku pod definici typu. Na pohovoru je to signál seniority.

## 3. Interface value = **dvojice (typ, hodnota)** 🧨

Interface proměnná není pointer. Je to **pár `(dynamický typ, dynamická hodnota)`**.
`iface == nil` platí, **jen když jsou nil OBĚ složky**.

Z toho plyne nejzákeřnější bug v Go, tzv. **typed nil**:

```go
type MyErr struct{}
func (e *MyErr) Error() string { return "boom" }

func mayFail(fail bool) error {
    var e *MyErr          // nil pointer typu *MyErr
    if fail {
        e = &MyErr{}
    }
    return e              // 🧨 BUG: vrací (typ=*MyErr, hodnota=nil) — a to NENÍ nil!
}

if err := mayFail(false); err != nil {
    // 💥 SEM TO SPADNE, i když nic neselhalo
}
```

**Proč:** vracíme proměnnou typu `*MyErr`. Při konverzi na `error` se uloží
*dynamický typ* `*MyErr` — a interface s vyplněným typem už není nil, i když hodnota
uvnitř nil je.

**Fix:** nikdy nevracej konkrétní pointer typ jako error. Vrať explicitní `nil`:

```go
func mayFail(fail bool) error {
    if !fail {
        return nil        // ✅ čistý nil interface
    }
    return &MyErr{}
}
```

> Věta na pohovor: **„Interface hodnota je pár (typ, hodnota); je nil jen když jsou
> nil obě. Proto nikdy nevracím konkrétní pointer typ jako `error`."**

## 4. Composition místo dědičnosti — embedding

Go nemá `extends`. Má **embedding**: vložíš typ do struktury bez jména a jeho metody
se „promovnou" navenek.

```go
type Logger struct{ Prefix string }
func (l Logger) Log(msg string) { fmt.Println(l.Prefix, msg) }

type Server struct {
    Logger          // embedded — Server teď MÁ metodu Log
    Addr string
}

s := Server{Logger: Logger{Prefix: "[srv]"}, Addr: ":8080"}
s.Log("started")    // funguje, promovaná metoda
```

⚠️ **Není to dědičnost.** `Server` **není** `Logger` v polymorfním smyslu dědičnosti —
je to **delegace**: `Server` má uvnitř `Logger` a přeposílá mu volání. Ale pozor,
`Server` tím splní i každý interface, který `Logger` splňoval — takže **polymorfně to
funguje**, jen mechanismus je jiný (skládání, ne podtypování).

Embedovat lze i **interface** — typicky u testovacích stubů:

```go
type stubStore struct {
    Store              // embedded interface: nesplněné metody panikaří,
    getFn func(string) ([]byte, error)  // ale já implementuju jen tu jednu, co test volá
}
```

## 5. `any` a kdy interface NEpoužít

`any` je alias pro `interface{}` — „cokoliv". Znamená to ale, že jsi **zahodil typovou
informaci** a musíš ji dobývat zpátky (type assertion — lekce 12) nebo generikami
(lekce 13).

**Nepoužívej interface, když:**
- máš jedinou implementaci a žádný test ji nemockuje (předčasná abstrakce),
- jde ti jen o „stejná logika pro víc typů" → to jsou **generika**, ne interface,
- píšeš `any` jen proto, že nevíš, jaký typ tam patří.

## Examples

| Soubor | Ukazuje |
|---|---|
| `examples/01-implicit-satisfaction/` | implicitní splnění, malý interface, polymorfní volání, `var _ I = (*T)(nil)` |
| `examples/02-method-sets/` | value vs. pointer receiver — co se zkompiluje a co ne, a proč |
| `examples/03-typed-nil/` | typed nil bug naživo + fix |

Spuštění: `go run ./lessons/11-interfaces-polymorphism/examples/03-typed-nil/`

## Drills — pokud tě limituje psaní, ne chápání 🏋️

`drills/` je šest mikro-cvičení z **prázdné stránky** (3 min každé), na svalovou paměť
syntaxe: deklarace interfacu → polymorfní funkce → pointer receiver → typed nil →
embedding → funkce jako implementace interfacu.

```bash
go test ./lessons/11-interfaces-polymorphism/drills/01-interface-basic/
```

Návod a „5 tvarů do prstů": `drills/README.md`. Smysl mají **až na druhý a třetí
průchod** — po prvním smaž a piš znovu.

## Exercise

Až tvary padnou do ruky: `exercise/` — zadání v `exercise/README.md`.
Testy: `go test -race ./lessons/11-interfaces-polymorphism/exercise/`

## Kontrolní otázky

1. Proč `Cat{}` nesplní interface, když `Speak()` má pointer receiver — a co by se
   pokazilo, kdyby to Go dovolilo?
2. Funkce vrací `error`, uvnitř má `var e *MyErr` a `return e`. Volající testuje
   `err != nil`. Co se stane a proč?
3. Kde se v Go idiomaticky definuje interface — u implementace, nebo u konzumenta?
   Proč zrovna tam?

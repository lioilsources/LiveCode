# Drills — polymorfismus do prstů

> Tyhle drilly nejsou na pochopení, ale na **psaní**. Každý je malý, píše se
> z prázdné stránky a má test. Cíl: napsat tvar **bez přemýšlení nad syntaxí**,
> aby ti na pohovoru zbyla hlava na problém, ne na `func (x T) M()`.

## Jak drilovat

1. Otevři `drill.go` — je **prázdný** (jen `package drill` a zadání v komentáři).
2. Napiš řešení **bez koukání** do LESSON.md a bez kopírování z předchozího drillu.
3. Spusť test. Zelená → jdi dál.
4. **Po dokončení všech šesti smaž obsah a projeď je znovu.** Teprve druhý/třetí
   průchod dělá svalovou paměť. Cíl: každý drill do 3 minut, poslední kolo naslepo.

```bash
# jeden drill
go test ./lessons/11-interfaces-polymorphism/drills/01-interface-basic/

# všechny najednou (až budeš mít hotovo)
go test ./lessons/11-interfaces-polymorphism/drills/...
```

## 5 tvarů, které chceš mít v prstech

Přečti jednou, pak zavři a piš. Víc textu k tomu nepotřebuješ.

```go
// 1) Interface + implementace — všimni si, že se nikde neřekne "implements"
type Greeter interface {
	Greet() string
}

type Czech struct{ Name string }

func (c Czech) Greet() string { return "Ahoj, " + c.Name }

// 2) Polymorfní funkce — bere interface, nezná konkrétní typy
func GreetAll(gs []Greeter) []string {
	out := make([]string, 0, len(gs))
	for _, g := range gs {
		out = append(out, g.Greet())
	}
	return out
}

// 3) Pointer receiver — když metoda MUTUJE, receiver musí být pointer
type Tally struct{ n int }

func (t *Tally) Inc() int { t.n++; return t.n }
//        ↑ pointer ⇒ interface splní jen *Tally, ne Tally

// 4) Typed nil — návratový typ je error, nil se vrací EXPLICITNĚ
func Validate(age int) error {
	if age < 0 {
		return &ValidationError{...}
	}
	return nil // ⚠️ ne `var e *ValidationError; return e`
}

// 5) Embedding — vložený typ promuje své metody navenek
type Service struct {
	Logger        // bez jména = embedded
	Name   string
}
// Service.Log(...) funguje a Service tím splní i interface, který splňoval Logger
```

Bonus tvar (drill 6) — **funkce jako implementace interfacu**, vzor z `net/http`:

```go
type HandlerFunc func(string) string

func (f HandlerFunc) Handle(msg string) string { return f(msg) }
//   ↑ metoda na FUNKČNÍM typu ⇒ obyčejná funkce jde použít jako interface
```

## Pořadí

| # | Drill | Sval |
|---|-------|------|
| 01 | `01-interface-basic` | deklarace interfacu + metody |
| 02 | `02-polymorphic-fn` | `[]Interface`, iterace, volání |
| 03 | `03-pointer-receiver` | pointer receiver a mutace |
| 04 | `04-typed-nil` | správné vracení `nil` chyby |
| 05 | `05-embedding` | composition místo dědičnosti |
| 06 | `06-func-adapter` | metoda na funkčním typu |

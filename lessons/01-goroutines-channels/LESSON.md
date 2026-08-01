# Lekce 1 — Goroutines & channels (recap)

> Tohle už znáš z chatu. Rychlé připomenutí + jedna nová nuance, pak rovnou cvičení.
> ⚠️ Pokud jsi ještě neodpověděl na kontrolní otázku (range vs. select), udělej to
> nejdřív z hlavy — rozbor je níž a spoiluje.

## Co už umíš (5 vět)

1. `go f()` spustí goroutinu — levné vlákno spravované runtimem, ne OS.
2. **Unbuffered channel = předání z ruky do ruky**: send blokuje, dokud si to někdo nepřevezme (a naopak). Buffered channel = odkládací polička o kapacitě N; blokuje se až při plné/prázdné.
3. Když všechny goroutiny spí a nikdo nemůže nic převzít → **deadlock**, runtime to pozná a spadne.
4. **Channel zavírá producent, nikdy consumer** — `close` je zpráva "už nic nepošlu", ne úklid paměti.
5. `for v := range ch` čte, dokud channel není **zavřený a vyprázdněný**; `select` vybere první připravenou větev (při více připravených losuje).

## Vzory k zapamatování (naslepo)

**Done channel** — signalizace "hotovo" bez posílání dat:

```go
done := make(chan struct{})
go func() {
    defer close(done)
    // ... práce ...
}()
<-done // počkej na dokončení
```

**Ok idiom** — rozliš "přišla nula" od "channel je zavřený":

```go
v, ok := <-ch
// ok == false  ⇒  channel zavřený a vyprázdněný; v je nulová hodnota typu
```

**For-select s kontextem** — worker se dvěma cestami ven:

```go
for {
    select {
    case j, ok := <-jobs:
        if !ok {
            return // (a) producent zavřel a vyprázdněno
        }
        process(j)
    case <-ctx.Done():
        return // (b) zrušení shora — na close nečekáme
    }
}
```

## Rozbor kontrolní otázky — `for range` vs. `for { select }`

**Otázka:** proč je ve workeru správně `for { select { case j := <-jobs: …; case <-ctx.Done(): return } }` a ne `for j := range jobs`?

**Odpověď:** `for j := range jobs` má **jedinou cestu ven — `close(jobs)`**. Když producent
channel nikdy nezavře (spadl, zapomněl, byl zrušen dřív, než se k close dostal) a context
se zruší, range-worker zůstane **navždy viset na čtení** → **goroutine leak**. Select dává
druhou, nezávislou cestu ven přes `ctx.Done()`.

**Nuance (častá chyba i u zkušených):** po `close(jobs)` vrací `<-jobs` **nulové hodnoty
donekonečna** — a to okamžitě, bez blokování. Worker s holým `case j := <-jobs:` se po
zavření channelu **roztočí naprázdno** a zpracovává nuly. Správně je vždy:

```go
case j, ok := <-jobs:
    if !ok {
        return
    }
```

> Věta na pohovor: **„Každá goroutina musí mít garantovanou cestu k ukončení —
> range ji má jen přes close, select i přes context."**

## Examples

| Soubor | Ukazuje |
|---|---|
| `examples/01-handoff/` | unbuffered handoff + done channel |
| `examples/02-close-range/` | producent zavírá, range končí, čtení po close (ok idiom) |
| `examples/03-range-vs-select/` | **důkaz leaku**: range-worker visí navždy, select-worker se ukončí; měřeno přes `runtime.NumGoroutine()` |

Spuštění: `go run ./lessons/01-goroutines-channels/examples/03-range-vs-select/`

## Exercise

`exercise/` — implementuj `Producer` a `Sum`. Zadání v `exercise/README.md`.
Testy: `go test -race ./lessons/01-goroutines-channels/exercise/`

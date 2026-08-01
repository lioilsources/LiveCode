# Exercise 01 — Producer & Sum

**Časový limit: ~15 minut** (na pohovoru by tohle byla rozehřívací úloha)

## Zadání

Implementuj dvě funkce v `sum.go`:

### 1. `Producer(n int) <-chan int`

Vrátí channel a **na pozadí** (v goroutině) do něj pošle čísla `1..n`. Potom
channel zavře. Pro `n <= 0` vrátí channel, ze kterého nikdy nic nepřijde,
ale čtení z něj **nesmí blokovat** (tj. rovnou zavřený).

Pravidla, která testy vynucují:
- zavírá **producent** — consumer (test) se spoléhá, že range/ok skončí
- `Producer` se vrací hned, neblokuje volajícího

### 2. `Sum(ctx context.Context, jobs <-chan int) int`

Čte čísla z `jobs` a sčítá je. Skončí, jakmile nastane **první** z:

- **(a)** `jobs` je zavřený a vyprázdněný → vrátí součet všeho, co přišlo,
- **(b)** `ctx` je zrušen → vrátí součet toho, co stihl přečíst.

Pravidla, která testy vynucují:
- nesmí viset donekonečna, když producent nikdy nezavře (cesta b)
- nesmí se roztočit na zavřeném channelu (po `close` vrací `<-jobs` nuly!)

## Spuštění testů

```bash
go test -race ./lessons/01-goroutines-channels/exercise/
```

## Pravidla hry

- Řeš sám, bez nahlížení do LESSON.md (vzory bys měl mít v ruce).
- Když testy padají, čti jejich hlášky — jsou psané jako nápověda.
- Review potom projdeme společně jako na pohovoru.

# Track C — HackerRank (online screening)

> HackerRank je **jiná disciplína** než live coding z Tracku A/B. Nikdo se tě
> neptá „proč", nikdo ti nenapoví. Jsi sám, běží čas, a hodnotí tě skryté testy.
> Tenhle track tě připraví na to, jak test vypadá, co v Go na něm bolí, a hlavně
> tě nechá **psát** — algoritmické vzory z prázdné stránky, dokud nejdou samy.

## 1. Jak test typicky vypadá

- **60–90 minut, 2–3 úlohy** (občas + pár multiple-choice otázek). Úlohy jsou
  řazené zhruba od lehké po střední (HackerRank *Easy/Medium*).
- Každá úloha má **skryté testy** a **částečné body** — projde-li 7 z 10 testů,
  máš 70 %. Odevzdej i nedokonalé řešení, prázdno je 0.
- Dva režimy zadání:
  1. **Doplň funkci** (nejčastější): dostaneš stub s `main`, který už čte vstup a
     tiskne výstup, a ty píšeš jen `func solve(arr []int32) int64`. I/O neřešíš.
  2. **Celý program**: prázdný `main`, čteš stdin, píšeš stdout. Tady vyhrává
     ten, kdo má I/O kostru v prstech (viz úloha 08 a cheatsheet).
- **Backend role často mají „REST API" úlohu**: zavolej mock API
  (`https://jsonmock.hackerrank.com/api/...`), projdi **všechny stránky**
  (`page`, `total_pages`) a něco agreguj. Trénuješ v úloze 07.
- Test může být **proctored** (webkamera, sledování přepnutí tabu). Neotvírej
  nic jiného, dokumentace Go je obvykle povolená v rámci editoru, ale radši
  s tím nepočítej — proto ten cheatsheet cvičíš naslepo.

### Go stub, který dostaneš (režim „doplň funkci")

Zkrácená, okomentovaná verze toho, co HackerRank generuje:

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

/*
 * Complete the 'countPairs' function below.
 * The function is expected to return an INTEGER.
 * The function accepts INTEGER_ARRAY arr as parameter.
 */
func countPairs(arr []int32) int32 { // ← TVOJE práce je jen tohle
	// ...
}

func main() {
	reader := bufio.NewReaderSize(os.Stdin, 16*1024*1024)  // rychlé čtení
	stdout, _ := os.Create(os.Getenv("OUTPUT_PATH"))       // výstup jde do souboru!
	defer stdout.Close()
	writer := bufio.NewWriterSize(stdout, 16*1024*1024)

	nTemp, _ := strconv.ParseInt(strings.TrimSpace(readLine(reader)), 10, 64)
	n := int32(nTemp)

	var arr []int32
	for i := 0; i < int(n); i++ {
		arrItemTemp, _ := strconv.ParseInt(strings.TrimSpace(readLine(reader)), 10, 64)
		arr = append(arr, int32(arrItemTemp))
	}

	result := countPairs(arr)
	fmt.Fprintf(writer, "%d\n", result)
	writer.Flush()
}

func readLine(reader *bufio.Reader) string {
	str, _, err := reader.ReadLine()
	if err == io.EOF {
		return ""
	}
	return strings.TrimRight(string(str), "\r\n")
}
```

Co z toho plyne:
- **Vstupy jsou `int32`**, výsledky často `int64`. Součet, součin nebo `x + k`
  u hodnot blízko `2^31` **přeteče**. Počítej v `int64` (`int64(a) + int64(b)`),
  nebo si vstup hned zkonvertuj na `[]int` a zpátky přetypuj až návratovou hodnotu.
- Nesahej na `main` a `readLine`. Když potřebuješ debug výpis, piš na
  **stderr** (`fmt.Fprintln(os.Stderr, ...)`) — cokoli navíc na stdout/OUTPUT_PATH
  ti shodí testy.
- Stub nepoužívá `slices`/`maps`. **Verze Go na HackerRanku bývá starší** než ta
  tvoje. První věc v editoru: zkus zkompilovat `import "slices"`. Když neprojde,
  máš `sort.Slice`, ruční `min`/`max` a `for i := 0; i < n; i++` (žádný
  `for i := range n`).

## 2. Strategie na 90 minut

1. **Prvních 5 minut: přečti všechny úlohy.** Začni tou, kterou vidíš na první
   dobrou. Obtížnost není vždy v pořadí.
2. **Constraints ti říkají složitost** — čti je dřív než příklady:

   | n do | Cílová složitost | Typicky |
   |------|------------------|---------|
   | 10–20 | `O(2^n)`, `O(n!)` | brute force, backtracking |
   | 10³ | `O(n²)` | dva vnořené cykly jsou OK |
   | 10⁵ – 10⁶ | `O(n log n)`, `O(n)` | sort, hash mapa, two pointers, prefix sums |
   | 10⁹+ | `O(log n)`, `O(1)` | matematika, binary search na odpovědi |

3. **Nejdřív správně, pak rychle.** Napiš očividné řešení, pusť ukázkové testy,
   **submitni** (body jsou v kapse), teprve pak optimalizuj, pokud padají testy
   na timeout (*Terminated due to timeout*).
4. **Vlastní test v „Custom input"** na hranice: `n = 1`, prázdný řetězec, všechno
   stejné, záporná čísla, max hodnoty. Skryté testy jsou přesně tohle.
5. Když úloha nejde do 20 minut, **odevzdej, co máš, a jdi dál**. Vrať se, zbyde-li čas.
6. Poslední 5 minut: zkontroluj, že máš u **každé** úlohy submit — ne jen „Run".

## 3. Go pasti, které na HackerRanku stojí body

| Past | Projev | Fix |
|------|--------|-----|
| `int32` přetečení | špatný výsledek na velkých testech | počítej v `int64` / `int` |
| `fmt.Scan` na 10⁶ číslech | timeout | `bufio.Scanner` + `ScanWords`, nebo `bufio.Reader` |
| `fmt.Println` v cyklu 10⁵× | timeout | `bufio.NewWriter(os.Stdout)` + `defer w.Flush()` |
| Iterace mapy | nedeterministický výstup | klíče vytáhni, seřaď, pak tiskni |
| `len(s)` u Unicode | „délka" v bajtech | `[]rune(s)` nebo `utf8.RuneCountInString` |
| `s[i]` je `byte` | `s[i] == "a"` nejde zkompilovat | `s[i] == 'a'` |
| rekurzivní DFS na 10⁶ buňkách | přetečení zásobníku | iterativní BFS s vlastní frontou |
| `sort.Slice` mutuje vstup | testy sdílející data padají | zkopíruj, když nemáš jistotu |
| `\r\n` na konci řádku | `strconv.Atoi` selže | `strings.TrimSpace` |
| zapomenutý `writer.Flush()` | prázdný výstup, 0 bodů | `defer writer.Flush()` hned po vytvoření |

## 4. Jak trénovat (pořadí)

1. **`cheatsheet/ALGO_CHEATSHEET.md`** — přečti jednou. Zavři.
2. **`hackerrank/drills/`** — 8 mikro-drillů na vzory, každý do 3–5 minut, z prázdné
   stránky. Stejná metodika jako drilly v lekci 11: napsat, smazat, napsat znovu.
3. **`hackerrank/tasks/`** — 8 úloh na čas ve formátu HackerRanku (zadání, constraints,
   sample I/O). Řeš se stopkami. Vzorové řešení v `solution/` otevři **až po pokusu**.
4. Den před testem: drilly naslepo, jeden průchod. Nic nového neučit.

```bash
go test ./hackerrank/drills/01-read-ints/      # jeden drill
go test ./hackerrank/tasks/01-pairs-with-diff/  # jedna úloha
go test ./hackerrank/...                        # všechno (až bude hotovo)
```

## 5. Checklist těsně před testem

- [ ] Umím napsat čtení `n` + `n` čísel ze stdin bez přemýšlení (drill 01, úloha 08).
- [ ] Vím, že `int32` přetéká a kde si dám `int64`.
- [ ] Umím `sort.Slice` s víceklíčovým porovnáním naslepo (drill 06).
- [ ] Umím BFS na mřížce s vlastní frontou (drill 08, úloha 05).
- [ ] Umím stránkované volání REST API + JSON dekódování (úloha 07).
- [ ] Debug jde na stderr, výstup je flushnutý.
- [ ] Submitnu každou úlohu, i nehotovou.

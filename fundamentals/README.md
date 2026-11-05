# Fundamentals — základy do prstů

> Vzniklo po Apify live codingu (3. 11. 2026). Úloha „otoč pole" nedoběhla
> v čase. Logika byla správně, ale do Go se přimíchala syntaxe z Javy/C
> (`int[]`, `length()`, `for (int i...)`, `:=` místo `=`) a na konci
> `return numbers` místo `return res`. Tyhle drilly jsou proti tomu.

## Pravidla

1. **Prázdný soubor.** `drill.go` obsahuje jen zadání. Piš bez koukání.
2. **Bez AI doplňování v editoru.** Copilot i jiné doplňování vypni. Na pohovoru ho mít nebudeš.
3. **Stopky.** Cíl je u každého drillu napsaný v zadání (2–3 min).
4. **Nejdřív kostra, hned kompilace.** Napiš podpis funkce a `return` s nulovou hodnotou
   a spusť `go test`. Syntaktické chyby vyřešíš dřív, než začneš řešit logiku.
5. **Řekni složitost nahlas, dvěma větami.** Čas zvlášť, paměť zvlášť:
   *„Čas O(n), protože každý prvek navštívím jednou. Paměť O(n), protože alokuju výsledné pole."*
6. **Po zelené smaž řešení** (`git checkout fundamentals/`) a za dva dny drill napiš znovu.

```bash
go test ./fundamentals/01-reverse/
go test ./fundamentals/...
git checkout fundamentals/   # vrátit prázdná zadání
```

## Drilly

| # | Drill | Sval | Cíl |
|---|-------|------|-----|
| 01 | `01-reverse` | nový slice, indexy `len-1-i`, vrátit správnou proměnnou | 2 min |
| 02 | `02-reverse-in-place` | two pointers, swap `a[i], a[j] = a[j], a[i]` | 2 min |
| 03 | `03-min-max` | start z `a[0]`, ne z nuly; prázdný vstup | 2 min |
| 04 | `04-dedup` | `map[int]bool` jako set, zachování pořadí | 3 min |
| 05 | `05-two-sum` | mapa hodnota → index, O(n) místo O(n²) | 3 min |
| 06 | `06-palindrome` | runy vs. bajty, `unicode` | 3 min |
| 07 | `07-word-freq` | `strings.FieldsFunc`, mapa jako čítač | 3 min |
| 08 | `08-merge-sorted` | dva ukazatele, dolít zbytek `append(res, a[i:]...)` | 3 min |
| 09 | `09-rotate` | modulo, prázdný vstup (dělení nulou) | 3 min |
| 10 | `10-chunk-generic` | generika `[T any]`, `min()`, poslední kratší kousek | 3 min |

Celé kolo by se mělo vejít do 30 minut. Až to půjde, přidej stopky na celé kolo
a pokus se dostat pod 20.

## Typické navazující otázky (procvič nahlas)

- „A bez druhého pole?" → drill 02.
- „Jaká je časová a paměťová složitost?" → vždy obě, zvlášť.
- „Co když je vstup prázdný / má jeden prvek / samá záporná čísla?"
- „Šlo by to bez mapy?" → ano, seřadit O(n log n), nebo dvojitá smyčka O(n²). Vždy řekni cenu.

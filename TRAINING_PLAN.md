# TRAINING_PLAN.md — 14 dní psaní na čas

> **Instrukce pro Claude Code:** Tohle je trénink rukou, ne výuka. Nevysvětluj
> dopředu a nepiš za uživatele kód. Zadej, pusť stopky, po pokusu udělej
> review jako interviewer (nejdřív otázka, pak oprava). Každý den zapiš řádek
> do tabulky Log na konci a commitni.

## Proč

Zpětná vazba z Apify live codingu (5. 11. 2026):

> *„…we needed more in hands-on coding fundamentals, as the coding exercise
> wasn't completed within the time, and in keeping answers focused and concise."*

Dvě slabiny, každá má vlastní trénink:

| Slabina | Co se stalo | Trénink |
|---|---|---|
| Psaní na čas | Reverse pole nedoběhl: Java syntaxe v Go, `return numbers` místo `return res` | `fundamentals/` + `hackerrank/` se stopkami, z prázdného souboru |
| Stručnost | Odpovědi odbíhaly od otázky | `interview/CONCISE_ANSWERS.md`, 30 s nahlas, nahrávat |

## Denní blok (~60 min)

1. **Rozcvička, 10 min:** 3–4 drilly z `fundamentals/` z prázdného souboru.
2. **Hlavní úloha, 30 min:** jeden blok podle rozpisu níže, se stopkami.
3. **Stručné odpovědi, 10 min:** 3 otázky z `interview/CONCISE_ANSWERS.md`, 30 s nahlas, nahrát.
4. **Log, 5 min:** řádek do tabulky dole (čas, kde ses zasekl).

Pravidla platí pro všechno: **vypnuté AI doplňování, kostra a kompilace jako první, složitost nahlas
(čas i paměť zvlášť), po zelené smazat a za dva dny znovu.**

## Rozpis

| Den | Datum | Rozcvička | Hlavní úloha | Odpovědi |
|---|---|---|---|---|
| 1 | pá 6. 11. | fundamentals 01–04 | hackerrank drilly 01–04 | 1–3 |
| 2 | so 7. 11. | fundamentals 05–07 | hackerrank drilly 05–08 | 4–6 |
| 3 | ne 8. 11. | fundamentals 08–10 | task 01 (pairs, 15 min) + task 02 (window, 15 min) | 7–9 |
| 4 | po 9. 11. | fundamentals 01–04 (2. kolo) | task 03 (top-k, 15 min) + task 04 (intervals, 15 min) | 10–12 |
| 5 | út 10. 11. | fundamentals 05–07 | task 05 (islands, BFS) | 1–3 |
| 6 | st 11. 11. | fundamentals 08–10 | task 07 (REST pagination) | 4–6 |
| 7 | čt 12. 11. | celé kolo fundamentals se stopkami | **MOCK 1** (viz níže) | — |
| 8 | pá 13. 11. | fundamentals 01–05 (3. kolo) | lekce 01 exercise (channels) + drilly lekce 11 | 7–9 |
| 9 | so 14. 11. | fundamentals 06–10 | task 06 (min coins) + task 08 (full program) | 10–12 |
| 10 | ne 15. 11. | hackerrank drilly 01–08 naslepo | task 01 a 02 znovu z prázdného souboru | 1–3 |
| 11 | po 16. 11. | fundamentals 01–05 | worker pool s `errgroup.SetLimit` z hlavy, 15 min | 4–6 |
| 12 | út 17. 11. | fundamentals 06–10 | task 03 a 05 znovu | 7–9 |
| 13 | st 18. 11. | celé kolo fundamentals, cíl pod 20 min | task 07 znovu + pool v TS (`ts/tasks/02`) | 10–12 |
| 14 | čt 19. 11. | celé kolo fundamentals | **MOCK 2** | všech 12, 30 s každá |

## Mock interview (dny 7 a 14)

45 minut, jako skutečný pohovor. Řekni Claudovi: *„Udělej mi mock live coding podle TRAINING_PLAN.md."*

Claude jako interviewer:
1. Zadá úlohu, kterou uživatel ještě neřešil (úroveň Easy/Medium, ne z repa).
2. Uživatel 1–2 minuty upřesňuje zadání a okrajové případy, pak **mluví při psaní**.
3. Claude nenapovídá, dokud se uživatel nezasekne na víc než 3 minuty.
4. Po dokončení položí dvě navazující otázky: složitost (čas i paměť) a „jak bys to zlepšil".
5. Pak položí jednu teoretickou otázku na 30 s.
6. Na konci hodnocení jako ve skutečné zpětné vazbě: dokončeno ano/ne, čas, stručnost odpovědí, jedna věc k zlepšení.

## Kritéria úspěchu po 14 dnech

- Celé kolo `fundamentals/` pod 20 minut bez nápovědy.
- HackerRank drilly každý pod limitem z `hackerrank/drills/README.md`.
- Úlohy 01–04 v limitu na první pokus.
- Mock 2 dokončený v čase a s odpověďmi do 30 s.

## Log

| Den | Datum | Rozcvička (čas) | Hlavní úloha (čas / hotovo?) | Kde jsem se zasekl |
|---|---|---|---|---|
| | | | | |

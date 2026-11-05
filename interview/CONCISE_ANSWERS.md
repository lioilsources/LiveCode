# Stručné odpovědi — trénink

> Zpětná vazba z Apify (5. 11. 2026): *„…keeping answers focused and concise
> on the question at hand."* Totéž bylo vidět na screeningu: otázka na
> concurrency v procesu → odpověď o Kubernetes autoscalingu.

## Vzorec: odpověď, důvod, stop

1. **První věta je přímá odpověď** na to, na co se ptali. Ne kontext, ne historie.
2. **Druhá věta je jeden důvod nebo jeden příklad.**
3. **Stop.** Nech interviewera doptat se. Pokud ho téma zajímá, zeptá se sám.

Limit je **30 sekund**. Když nevíš, řekni to jednou větou a pak řekni, jak bys to zjistil.

Při live codingu platí totéž: řekni, co jdeš udělat („nejdřív naivně O(n²), pak to zrychlím mapou"),
a **piš**. Mluv při psaní, ne místo psaní.

## Jak trénovat

Každý den 3 otázky. Nastav stopky na 30 s, odpověz nahlas a nahraj se na telefon.
Poslechni si to a zkontroluj tři věci:
- Byla první věta odpovědí na otázku?
- Vešel ses do 30 s?
- Odbočil jsi k vlastním projektům, když se na ně neptali?

Teprve pak si přečti vzorovou odpověď.

## Otázky a vzorové odpovědi

### Go a concurrency

**1. Jak v Go omezíš počet souběžně běžících goroutin?**
> `errgroup` s `SetLimit(n)`, nebo semafor z bufferovaného channelu velikosti n. Bez limitu by 10 000 jobů spustilo 10 000 goroutin a třeba vyčerpalo spojení do databáze.

**2. Co je goroutine leak a jak mu předejdeš?**
> Goroutina, která navždy visí na channelu, zatímco program běží dál, takže paměť roste. Každá goroutina musí mít cestu ven: `select` s `ctx.Done()` a channel, který zavře producent.

**3. Jaký je rozdíl mezi leakem a deadlockem?**
> Při deadlocku spí všechny goroutiny a runtime program shodí. Při leaku visí jen některé, program běží dál a nic nehlásí.

**4. K čemu je `context.Context`?**
> K propagaci zrušení a deadlinu přes celý řetěz volání. Když klient zavře spojení, zruší se i databázový dotaz a volání dalších služeb.

**5. Co patří do context values?**
> Jen data vázaná na request, třeba trace ID nebo identita uživatele. Ne závislosti ani konfigurace, ty se předávají parametry.

**6. Kdy vracíš pointer a kdy hodnotu?**
> Pointer, když je `nil` smysluplný (typicky spolu s `error`), když je struct velký nebo když ho volající má měnit. Jinak hodnotu.

### Algoritmy

**7. Jaká je složitost otočení pole do nového slice?**
> Čas O(n), protože každý prvek navštívím jednou. Paměť O(n) kvůli výslednému poli, na místě by to bylo O(1).

**8. Jak najdeš dvě čísla s daným součtem v neseřazeném poli?**
> Projdu pole jednou a ukládám hodnoty do mapy, pro každé číslo se podívám, jestli v ní už je doplněk. Čas O(n), paměť O(n).

### Distribuované systémy

**9. Jak zajistíš, že retry nezpůsobí dvojí platbu?**
> Idempotency key: klient pošle unikátní klíč a server požadavek se stejným klíčem podruhé neprovede. Retry pak dělám s exponential backoff a jitterem.

**10. Jak zajistíš, že se zápis do databáze a odeslání eventu nerozjedou?**
> Outbox pattern: event zapíšu do tabulky outbox ve stejné transakci jako data a samostatný proces ho pak publikuje. Consumer musí být idempotentní, protože doručení je at-least-once.

### Behaviorální

**11. Řekni nám něco o sobě.** (limit 60 s, jediná delší odpověď)
> Backend developer s 20 lety praxe, poslední roky v Go. V Omiu jsem byl tech lead integrace s Uberem a vedl Go chapter. Teď stavím vlastní AI infrastrukturu a aplikace. Hledám tým, kde budu dělat backend, který škáluje.

Tady se hodí zmínit AI pipeline, ale jednou větou. Detaily jen na doptání.

**12. Proč jsi úlohu nedokončil?** (když se zeptají na předchozí pohovor nebo na chybu)
> Logiku jsem měl správně, ale ztratil jsem čas na syntaktických chybách. Teď píšu nejdřív kostru a hned ji kompiluju, logiku řeším až potom.

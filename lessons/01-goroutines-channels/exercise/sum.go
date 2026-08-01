// Cvičení lekce 1 — zadání v README.md. Doplň TODO a spusť:
//
//	go test -race ./lessons/01-goroutines-channels/exercise/
package exercise

import "context"

// Producer vrátí channel a na pozadí do něj pošle čísla 1..n.
// Po odeslání channel zavře — zavírá VŽDY producent.
// Pro n <= 0 vrátí rovnou zavřený (prázdný) channel.
func Producer(n int) <-chan int {
	// TODO: implementuj
	return nil
}

// Sum čte čísla z jobs a sčítá je. Skončí, jakmile:
//
//	a) je jobs zavřený a vyprázdněný — vrátí součet všeho, co přišlo, NEBO
//	b) je zrušen ctx — vrátí součet toho, co stihl přečíst.
//
// Nesmí viset donekonečna a nesmí se točit na zavřeném channelu
// (po close vrací <-jobs nulové hodnoty — potřebuješ variantu s ok).
func Sum(ctx context.Context, jobs <-chan int) int {
	// TODO: implementuj
	return 0
}

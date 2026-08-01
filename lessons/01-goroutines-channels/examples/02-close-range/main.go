// Recap: channel zavírá producent. range končí sám po close + vyprázdnění.
// Nuance: čtení ze ZAVŘENÉHO channelu vrací okamžitě nulovou hodnotu + ok=false.
package main

import "fmt"

func main() {
	jobs := make(chan int, 3)

	// Producent: pošle a zavře. Close = "už nic nepošlu".
	go func() {
		defer close(jobs)
		for i := 1; i <= 3; i++ {
			jobs <- i
		}
	}()

	// Consumer: range skončí, až je channel zavřený A vyprázdněný.
	for j := range jobs {
		fmt.Println("zpracováno:", j)
	}

	// A teď ta past: čtení po close NEblokuje — vrací nuly donekonečna.
	v1, ok1 := <-jobs
	v2, ok2 := <-jobs
	fmt.Printf("čtení po close: v=%d ok=%v (a znovu: v=%d ok=%v)\n", v1, ok1, v2, ok2)
	fmt.Println("=> proto ve for-select vždy `j, ok := <-jobs; if !ok { return }`")
}

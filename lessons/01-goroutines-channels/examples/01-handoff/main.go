// Recap: unbuffered channel = předání z ruky do ruky.
// Send blokuje, dokud si hodnotu druhá strana nepřevezme.
// Navíc: done channel — signalizace "hotovo" bez posílání dat.
package main

import (
	"fmt"
	"time"
)

func main() {
	work := make(chan string)   // unbuffered — handoff
	done := make(chan struct{}) // signalizace konce workera

	go func() {
		defer close(done) // "končím" — zavírá ten, kdo signál vlastní
		fmt.Println("worker: čekám na práci...")
		msg := <-work
		fmt.Println("worker: převzato:", msg)
	}()

	time.Sleep(300 * time.Millisecond) // jen ať je vidět pořadí výpisů
	fmt.Println("main:   posílám (a blokuju, dokud si to worker nevezme)")
	work <- "analyze goroutine dump"
	fmt.Println("main:   předáno")

	<-done // počkej, až worker skončí — žádný time.Sleep hazard
	fmt.Println("main:   worker potvrzen mrtvý, končím")
}

package exercise

import (
	"context"
	"slices"
	"testing"
	"time"
)

func TestProducerSendsAllAndCloses(t *testing.T) {
	ch := Producer(5)
	if ch == nil {
		t.Fatal("Producer vrátil nil — vrať skutečný channel")
	}

	var got []int
	timeout := time.After(time.Second)
	for {
		select {
		case v, ok := <-ch:
			if !ok { // zavřeno a vyprázdněno — hotovo
				if want := []int{1, 2, 3, 4, 5}; !slices.Equal(got, want) {
					t.Fatalf("přijato %v, chci %v", got, want)
				}
				return
			}
			got = append(got, v)
		case <-timeout:
			t.Fatalf("Producer channel nezavřel (zatím přijato %v) — zavírá producent!", got)
		}
	}
}

func TestProducerZero(t *testing.T) {
	ch := Producer(0)
	if ch == nil {
		t.Fatal("Producer vrátil nil — i pro n=0 vrať (zavřený) channel")
	}
	select {
	case v, ok := <-ch:
		if ok {
			t.Fatalf("pro n=0 nemá přijít žádná hodnota, přišlo %d", v)
		}
		// ok == false ⇒ zavřený channel — správně
	case <-time.After(time.Second):
		t.Fatal("pro n=0 má být channel rovnou zavřený — čtení nesmí blokovat")
	}
}

func TestSumUntilClose(t *testing.T) {
	jobs := make(chan int, 3)
	jobs <- 1
	jobs <- 2
	jobs <- 3
	close(jobs)

	done := make(chan int, 1)
	go func() { done <- Sum(context.Background(), jobs) }()

	select {
	case got := <-done:
		if got != 6 {
			t.Fatalf("Sum = %d, chci 6", got)
		}
	case <-time.After(time.Second):
		t.Fatal("Sum po close(jobs) neskončil — po close vrací <-jobs nuly donekonečna; čteš s variantou `j, ok := <-jobs`?")
	}
}

func TestSumReturnsOnCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	jobs := make(chan int) // unbuffered a NIKDY nezavřený
	done := make(chan int, 1)
	go func() { done <- Sum(ctx, jobs) }()

	// send helper: když Sum nečte, selži srozumitelně místo zamrznutí testu
	send := func(v int) {
		t.Helper()
		select {
		case jobs <- v:
		case <-time.After(time.Second):
			t.Fatalf("Sum nečte z jobs (posílám %d) — je vůbec implementován?", v)
		}
	}
	send(10)
	send(5)
	cancel() // producent už nic nepošle a nikdy nezavře

	select {
	case got := <-done:
		if got != 15 {
			t.Fatalf("Sum = %d, chci 15 (10+5 přečtené před cancel)", got)
		}
	case <-time.After(time.Second):
		t.Fatal("Sum po zrušení contextu neskončil — chybí `case <-ctx.Done(): return`? (range tady nestačí)")
	}
}

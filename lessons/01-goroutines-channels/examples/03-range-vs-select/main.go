// Důkaz ke kontrolní otázce: proč `for range jobs` může leaknout,
// zatímco `for { select … }` má vždy cestu ven.
//
// Scénář: producent NIKDY nezavře channel (spadl, zapomněl…) a context
// se zruší. range-worker zůstane viset navždy = goroutine leak.
// Leak je vidět na runtime.NumGoroutine().
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func rangeWorker(jobs <-chan int) {
	// Jediná cesta ven je close(jobs) — a ten nikdy nepřijde.
	for j := range jobs {
		fmt.Println("rangeWorker  zpracoval:", j)
	}
	fmt.Println("rangeWorker  končí") // nikdy se nevypíše
}

func selectWorker(ctx context.Context, jobs <-chan int) {
	for {
		select {
		case j, ok := <-jobs:
			if !ok {
				fmt.Println("selectWorker: channel zavřen, končím")
				return
			}
			fmt.Println("selectWorker zpracoval:", j)
		case <-ctx.Done():
			fmt.Println("selectWorker: context zrušen, končím")
			return
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	jobsA := make(chan int) // pro range-workera
	jobsB := make(chan int) // pro select-workera

	go rangeWorker(jobsA)
	go selectWorker(ctx, jobsB)

	jobsA <- 1
	jobsB <- 1

	fmt.Println("goroutin před cancel:", runtime.NumGoroutine()) // 3 = main + oba workeři

	cancel()
	time.Sleep(200 * time.Millisecond) // dej workerům čas zareagovat

	// selectWorker skončil. rangeWorker visí na <-jobsA navždy.
	fmt.Println("goroutin po cancel: ", runtime.NumGoroutine()) // 2 = main + LEAKNUTÝ rangeWorker
	fmt.Println("=> range-worker nemá jak skončit; v produkci se tyhle leaky sčítají")
}

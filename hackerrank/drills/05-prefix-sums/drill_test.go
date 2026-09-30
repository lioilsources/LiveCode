package drill

import (
	"testing"
	"time"
)

func TestPrefixSum(t *testing.T) {
	p := NewPrefix([]int{3, -1, 4, 1, 5, -9})
	cases := []struct{ l, r, want int }{
		{0, 5, 3}, {0, 0, 3}, {5, 5, -9}, {1, 3, 4}, {2, 4, 10},
	}
	for _, c := range cases {
		if got := p.Sum(c.l, c.r); got != c.want {
			t.Errorf("Sum(%d, %d) = %d, chci %d", c.l, c.r, got, c.want)
		}
	}
}

func TestPrefixSumEmpty(t *testing.T) {
	_ = NewPrefix(nil) // nesmí spadnout
}

func TestPrefixSumIsConstantTime(t *testing.T) {
	const n = 1_000_000
	a := make([]int, n)
	for i := range a {
		a[i] = 1
	}
	p := NewPrefix(a)
	start := time.Now()
	var total int
	for q := 0; q < n; q++ {
		total += p.Sum(0, n-1-q%1000)
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("10^6 dotazů trvalo %v — Sum iteruje?", d)
	}
	if total <= 0 {
		t.Fatal("nesmysl")
	}
}

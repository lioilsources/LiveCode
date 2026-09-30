package drill

import (
	"fmt"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestReadIntsBasic(t *testing.T) {
	got, err := ReadInts(strings.NewReader("5\n3 1 4 1 5\n"))
	if err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if want := []int{3, 1, 4, 1, 5}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, chci %v", got, want)
	}
}

func TestReadIntsLayoutDoesNotMatter(t *testing.T) {
	inputs := []string{
		"4\r\n-1 2\r\n3 -4\r\n",   // Windows konce řádků
		"4 -1 2 3 -4",             // vše na jednom řádku, bez \n na konci
		"\n\n4\n-1\n2\n3\n-4\n\n", // každé číslo na řádku, prázdné řádky
	}
	for _, in := range inputs {
		got, err := ReadInts(strings.NewReader(in))
		if err != nil {
			t.Fatalf("%q: nečekaná chyba: %v", in, err)
		}
		if want := []int{-1, 2, 3, -4}; !reflect.DeepEqual(got, want) {
			t.Errorf("%q: got %v, chci %v\n  (rozděluj na tokeny, ne na řádky)", in, got, want)
		}
	}
}

func TestReadIntsZero(t *testing.T) {
	got, err := ReadInts(strings.NewReader("0\n"))
	if err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if got == nil || len(got) != 0 {
		t.Errorf("pro n=0 chci prázdný ne-nil slice, got %#v", got)
	}
}

func TestReadIntsErrors(t *testing.T) {
	for _, in := range []string{"3\n1 2\n", "2\n1 x\n", ""} {
		if _, err := ReadInts(strings.NewReader(in)); err == nil {
			t.Errorf("%q: chci chybu, got nil", in)
		}
	}
}

func TestReadIntsIsFast(t *testing.T) {
	const n = 1_000_000
	var sb strings.Builder
	fmt.Fprintf(&sb, "%d\n", n)
	for i := 0; i < n; i++ {
		fmt.Fprintf(&sb, "%d ", i)
	}
	start := time.Now()
	got, err := ReadInts(strings.NewReader(sb.String()))
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != n || got[n-1] != n-1 {
		t.Fatalf("len=%d, last=%d", len(got), got[len(got)-1])
	}
	if d := time.Since(start); d > time.Second {
		t.Errorf("10^6 čísel trvalo %v — to je timeout (používáš fmt.Fscan?)", d)
	}
}

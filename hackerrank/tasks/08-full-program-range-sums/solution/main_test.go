package main

import (
	"bytes"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"
)

func TestRunSample(t *testing.T) {
	in := "5\n1 2 3 4 5\n3\n1 5\n2 3\n4 4\n"
	var out bytes.Buffer
	if err := Run(strings.NewReader(in), &out); err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if want := "15\n5\n4\n"; out.String() != want {
		t.Fatalf("got %q, chci %q", out.String(), want)
	}
}

func TestRunWindowsLineEndingsAndNegatives(t *testing.T) {
	in := "3\r\n-5 10 -5\r\n2\r\n1 3\r\n1 1\r\n"
	var out bytes.Buffer
	if err := Run(strings.NewReader(in), &out); err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if want := "0\n-5\n"; out.String() != want {
		t.Fatalf("got %q, chci %q", out.String(), want)
	}
}

// countingWriter počítá volání Write — bufferovaný výstup jich udělá pár,
// fmt.Fprintln po řádcích jich udělá Q.
type countingWriter struct {
	io.Writer
	calls int
}

func (c *countingWriter) Write(p []byte) (int, error) {
	c.calls++
	return c.Writer.Write(p)
}

func TestRunLargeInputIsFastAndBuffered(t *testing.T) {
	const n, q = 200_000, 200_000
	var sb strings.Builder
	fmt.Fprintf(&sb, "%d\n", n)
	for i := 0; i < n; i++ {
		sb.WriteString("1000000000 ")
	}
	fmt.Fprintf(&sb, "\n%d\n", q)
	for i := 0; i < q; i++ {
		fmt.Fprintf(&sb, "1 %d\n", n)
	}

	var buf bytes.Buffer
	cw := &countingWriter{Writer: &buf}
	start := time.Now()
	if err := Run(strings.NewReader(sb.String()), cw); err != nil {
		t.Fatalf("nečekaná chyba: %v", err)
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Errorf("2·10^5 čísel + 2·10^5 dotazů trvalo %v — timeout", d)
	}
	if cw.calls > q/100 {
		t.Errorf("výstup zapsán %d voláními Write — bufferuj (bufio.Writer + Flush)", cw.calls)
	}
	want := "200000000000000\n" // 2·10^5 × 10^9 — přeteklo by int32
	if !strings.HasPrefix(buf.String(), want) || buf.Len() != len(want)*q {
		t.Fatalf("špatný výstup (začátek %q, délka %d)", firstN(buf.String(), 40), buf.Len())
	}
}

func firstN(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

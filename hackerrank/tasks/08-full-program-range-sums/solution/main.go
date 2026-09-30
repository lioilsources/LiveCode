package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strconv"
)

func main() {
	if err := Run(os.Stdin, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// Run přečte vstup dle zadání z in a vypíše odpovědi na dotazy do out.
func Run(in io.Reader, out io.Writer) error {
	sc := bufio.NewScanner(in)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Split(bufio.ScanWords)
	next := func() (int, error) {
		if !sc.Scan() {
			return 0, fmt.Errorf("unexpected end of input")
		}
		return strconv.Atoi(sc.Text())
	}

	w := bufio.NewWriter(out)
	defer w.Flush()

	n, err := next()
	if err != nil {
		return err
	}
	pre := make([]int, n+1)
	for i := 0; i < n; i++ {
		v, err := next()
		if err != nil {
			return err
		}
		pre[i+1] = pre[i] + v
	}

	q, err := next()
	if err != nil {
		return err
	}
	for i := 0; i < q; i++ {
		l, err := next()
		if err != nil {
			return err
		}
		r, err := next()
		if err != nil {
			return err
		}
		w.WriteString(strconv.Itoa(pre[r] - pre[l-1]))
		w.WriteByte('\n')
	}
	return nil
}

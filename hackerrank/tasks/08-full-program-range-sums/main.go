package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	if err := Run(os.Stdin, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// Run přečte vstup dle zadání z in a vypíše odpovědi na dotazy do out.
// Hodí se: bufio (Scanner + ScanWords, Writer + Flush), strconv.
func Run(in io.Reader, out io.Writer) error {
	// TODO
	return nil
}

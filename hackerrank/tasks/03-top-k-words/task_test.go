package task

import (
	"reflect"
	"testing"
)

func TestTopKWords(t *testing.T) {
	cases := []struct {
		name string
		text string
		k    int
		want []string
	}{
		{"sample", "the cat and The dog and the bird", 2, []string{"the", "and"}},
		{"shoda → abecedně", "b a c b a c", 3, []string{"a", "b", "c"}},
		{"k větší než počet slov", "x y x", 10, []string{"x", "y"}},
		{"whitespace všeho druhu", "  go\tgo\n\ngo  rust \t", 2, []string{"go", "rust"}},
		{"case-insensitive", "Go GO go gO Rust", 1, []string{"go"}},
		{"prázdný text", "", 3, []string{}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			for i := 0; i < 10; i++ { // náhodné pořadí mapy by odhalilo chybějící sort
				got := TopKWords(c.text, c.k)
				if len(got) == 0 && len(c.want) == 0 {
					continue
				}
				if !reflect.DeepEqual(got, c.want) {
					t.Fatalf("TopKWords(%q, %d) = %v, chci %v", c.text, c.k, got, c.want)
				}
			}
		})
	}
}

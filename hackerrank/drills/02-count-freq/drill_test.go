package drill

import "testing"

func TestMostFrequent(t *testing.T) {
	cases := []struct {
		name string
		in   []int
		want int
	}{
		{"jasný vítěz", []int{1, 2, 2, 3, 2}, 2},
		{"jediný prvek", []int{7}, 7},
		{"shoda → nejmenší", []int{5, 3, 5, 3, 9}, 3},
		{"všechno jednou → nejmenší", []int{4, 9, 1, 6}, 1},
		{"záporná čísla", []int{-2, -2, 0, 0, -5}, -2},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			// spusť víckrát — náhodné pořadí mapy odhalí špatný tie-break
			for i := 0; i < 20; i++ {
				if got := MostFrequent(c.in); got != c.want {
					t.Fatalf("MostFrequent(%v) = %d, chci %d", c.in, got, c.want)
				}
			}
		})
	}
}

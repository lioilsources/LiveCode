package task

import (
	"reflect"
	"testing"
)

func TestMergeIntervals(t *testing.T) {
	cases := []struct {
		name string
		in   [][2]int
		want [][2]int
	}{
		{"sample", [][2]int{{1, 3}, {8, 10}, {2, 6}, {15, 18}}, [][2]int{{1, 6}, {8, 10}, {15, 18}}},
		{"dotýkající se", [][2]int{{1, 3}, {3, 5}}, [][2]int{{1, 5}}},
		{"vnořený — end se nesmí zmenšit", [][2]int{{1, 10}, {2, 3}, {4, 5}}, [][2]int{{1, 10}}},
		{"bez překryvu", [][2]int{{5, 6}, {1, 2}}, [][2]int{{1, 2}, {5, 6}}},
		{"jeden", [][2]int{{1, 1}}, [][2]int{{1, 1}}},
		{"prázdný", [][2]int{}, [][2]int{}},
		{"řetězové slučování", [][2]int{{1, 2}, {2, 3}, {3, 4}, {10, 11}}, [][2]int{{1, 4}, {10, 11}}},
		{"záporné", [][2]int{{-5, -1}, {-3, 2}, {3, 4}}, [][2]int{{-5, 2}, {3, 4}}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := MergeIntervals(c.in)
			if len(got) == 0 && len(c.want) == 0 {
				return
			}
			if !reflect.DeepEqual(got, c.want) {
				t.Fatalf("MergeIntervals(%v) = %v, chci %v", c.in, got, c.want)
			}
		})
	}
}

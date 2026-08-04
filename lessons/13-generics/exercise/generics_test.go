package exercise

import (
	"slices"
	"strconv"
	"testing"
)

// Celsius je pojmenovaný typ nad float64 — testuje vlnovku v constraintu Number.
type Celsius float64

func TestMapSlice(t *testing.T) {
	got := MapSlice([]int{1, 2, 3}, strconv.Itoa)
	if want := []string{"1", "2", "3"}; !slices.Equal(got, want) {
		t.Errorf("MapSlice = %v, chci %v", got, want)
	}

	// Změna typu T → U
	lens := MapSlice([]string{"a", "bb", "ccc"}, func(s string) int { return len(s) })
	if want := []int{1, 2, 3}; !slices.Equal(lens, want) {
		t.Errorf("MapSlice(len) = %v, chci %v", lens, want)
	}

	if got := MapSlice(nil, strconv.Itoa); got == nil || len(got) != 0 {
		t.Errorf("MapSlice(nil) = %v, chci prázdný (ne nil) slice", got)
	}
}

func TestFilter(t *testing.T) {
	got := Filter([]int{1, 2, 3, 4, 5, 6}, func(n int) bool { return n%2 == 0 })
	if want := []int{2, 4, 6}; !slices.Equal(got, want) {
		t.Errorf("Filter = %v, chci %v", got, want)
	}

	none := Filter([]int{1, 3}, func(n int) bool { return n%2 == 0 })
	if len(none) != 0 {
		t.Errorf("Filter bez shody = %v, chci prázdný slice", none)
	}

	if got := Filter(nil, func(n int) bool { return true }); got == nil || len(got) != 0 {
		t.Errorf("Filter(nil) = %v, chci prázdný (ne nil) slice", got)
	}
}

func TestSortedKeys(t *testing.T) {
	m := map[string]int{"cherry": 3, "apple": 1, "banana": 2}
	got := SortedKeys(m)
	if want := []string{"apple", "banana", "cherry"}; !slices.Equal(got, want) {
		t.Errorf("SortedKeys = %v, chci %v (seřazené!)", got, want)
	}

	nums := map[int]string{30: "c", 10: "a", 20: "b"}
	gotN := SortedKeys(nums)
	if want := []int{10, 20, 30}; !slices.Equal(gotN, want) {
		t.Errorf("SortedKeys(int) = %v, chci %v", gotN, want)
	}

	if got := SortedKeys(map[string]int{}); len(got) != 0 {
		t.Errorf("SortedKeys(prázdná) = %v, chci prázdný slice", got)
	}
}

func TestMaxOf(t *testing.T) {
	if got, ok := MaxOf([]int{3, 7, 2}); !ok || got != 7 {
		t.Errorf("MaxOf([3 7 2]) = %v, %v; chci 7, true", got, ok)
	}
	if got, ok := MaxOf([]string{"a", "c", "b"}); !ok || got != "c" {
		t.Errorf("MaxOf(strings) = %v, %v; chci \"c\", true", got, ok)
	}
	if got, ok := MaxOf([]float64{1.5, 0.5}); !ok || got != 1.5 {
		t.Errorf("MaxOf(floats) = %v, %v; chci 1.5, true", got, ok)
	}

	// Prázdný → nulová hodnota T + false
	got, ok := MaxOf([]int{})
	if ok || got != 0 {
		t.Errorf("MaxOf(prázdný) = %v, %v; chci 0, false (var zero T)", got, ok)
	}
	gotS, ok := MaxOf([]string(nil))
	if ok || gotS != "" {
		t.Errorf("MaxOf(nil strings) = %q, %v; chci \"\", false", gotS, ok)
	}
}

func TestSum(t *testing.T) {
	if got := Sum([]int{1, 2, 3}); got != 6 {
		t.Errorf("Sum(ints) = %v, chci 6", got)
	}
	if got := Sum([]float64{1.5, 2.5}); got != 4.0 {
		t.Errorf("Sum(floats) = %v, chci 4.0", got)
	}
	if got := Sum([]int{}); got != 0 {
		t.Errorf("Sum(prázdný) = %v, chci 0", got)
	}

	// 🧨 Tohle projde JEN s vlnovkou v constraintu Number.
	// Bez ~ dostaneš: Celsius does not satisfy Number (possibly missing ~ for float64)
	temps := []Celsius{20.5, 21.0, 0.5}
	if got := Sum(temps); got != Celsius(42.0) {
		t.Errorf("Sum(Celsius) = %v, chci 42.0", got)
	}
}

func TestStack(t *testing.T) {
	s := NewStack[int]()
	if s == nil {
		t.Fatal("NewStack vrátil nil")
	}
	if s.Len() != 0 {
		t.Errorf("Len() nového zásobníku = %d, chci 0", s.Len())
	}

	s.Push(1)
	s.Push(2)
	s.Push(3)
	if s.Len() != 3 {
		t.Errorf("Len() = %d, chci 3", s.Len())
	}

	// LIFO
	for _, want := range []int{3, 2, 1} {
		got, ok := s.Pop()
		if !ok || got != want {
			t.Fatalf("Pop() = %v, %v; chci %d, true (LIFO!)", got, ok, want)
		}
	}

	got, ok := s.Pop()
	if ok || got != 0 {
		t.Errorf("Pop() z prázdného = %v, %v; chci 0, false", got, ok)
	}
}

func TestStackHoldsAnyType(t *testing.T) {
	strs := NewStack[string]()
	strs.Push("a")
	if got, ok := strs.Pop(); !ok || got != "a" {
		t.Errorf("Stack[string].Pop() = %q, %v", got, ok)
	}
	// zero value pro string je "", ne nil
	if got, ok := strs.Pop(); ok || got != "" {
		t.Errorf("prázdný Stack[string].Pop() = %q, %v; chci \"\", false", got, ok)
	}

	ptrs := NewStack[*int]()
	if got, ok := ptrs.Pop(); ok || got != nil {
		t.Errorf("prázdný Stack[*int].Pop() = %v, %v; chci nil, false", got, ok)
	}
}

package drill

import (
	"reflect"
	"testing"
)

func TestRank(t *testing.T) {
	in := []Player{
		{"bob", 50}, {"alice", 70}, {"carol", 50}, {"dave", 90}, {"abe", 50},
	}
	want := []Player{
		{"dave", 90}, {"alice", 70}, {"abe", 50}, {"bob", 50}, {"carol", 50},
	}
	got := Rank(in)
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("Rank() =\n  %v\nchci\n  %v", got, want)
	}
}

func TestRankDoesNotMutateInput(t *testing.T) {
	in := []Player{{"b", 1}, {"a", 2}}
	orig := []Player{{"b", 1}, {"a", 2}}
	_ = Rank(in)
	if !reflect.DeepEqual(in, orig) {
		t.Fatalf("vstup se změnil na %v — sort.Slice řadí in place, zkopíruj si ho", in)
	}
}

func TestRankEmpty(t *testing.T) {
	if got := Rank(nil); len(got) != 0 {
		t.Fatalf("got %v", got)
	}
}

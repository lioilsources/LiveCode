package drill

import (
	"math"
	"testing"
)

func closeTo(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestAreas(t *testing.T) {
	if got := Shape(Square{Side: 3}).Area(); !closeTo(got, 9) {
		t.Errorf("Square{3}.Area() = %v, chci 9", got)
	}
	if got := Shape(Rect{W: 2, H: 5}).Area(); !closeTo(got, 10) {
		t.Errorf("Rect{2,5}.Area() = %v, chci 10", got)
	}
}

func TestTotalArea(t *testing.T) {
	shapes := []Shape{Square{Side: 2}, Rect{W: 3, H: 4}} // 4 + 12
	if got := TotalArea(shapes); !closeTo(got, 16) {
		t.Errorf("TotalArea = %v, chci 16", got)
	}
	if got := TotalArea(nil); !closeTo(got, 0) {
		t.Errorf("TotalArea(nil) = %v, chci 0", got)
	}
}

func TestBiggestArea(t *testing.T) {
	shapes := []Shape{Square{Side: 2}, Rect{W: 3, H: 4}, Square{Side: 1}}
	if got := BiggestArea(shapes); !closeTo(got, 12) {
		t.Errorf("BiggestArea = %v, chci 12", got)
	}
	if got := BiggestArea(nil); !closeTo(got, 0) {
		t.Errorf("BiggestArea(nil) = %v, chci 0", got)
	}
}

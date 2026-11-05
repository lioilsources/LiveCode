package drill

import "testing"

func TestIsPalindrome(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"A man, a plan, a canal: Panama", true},
		{"Jelenovi pivo nelej", true},
		{"řeř", true},
		{"ab", false},
		{"race a car", false},
		{"", true},
		{".,!", true},
		{"12321", true},
	}
	for _, c := range cases {
		if got := IsPalindrome(c.in); got != c.want {
			t.Errorf("IsPalindrome(%q) = %v, chci %v", c.in, got, c.want)
		}
	}
}

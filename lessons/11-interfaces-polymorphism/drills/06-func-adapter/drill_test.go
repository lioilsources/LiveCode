package drill

import (
	"strings"
	"testing"
)

func TestFuncAsHandler(t *testing.T) {
	// Obyčejná stdlib funkce se stane implementací interfacu.
	var h Handler = HandlerFunc(strings.ToUpper)

	if got, want := h.Handle("abc"), "ABC"; got != want {
		t.Errorf("Handle = %q, chci %q", got, want)
	}
}

func TestFuncLiteralAsHandler(t *testing.T) {
	var h Handler = HandlerFunc(func(s string) string { return s + "!" })

	if got, want := h.Handle("ahoj"), "ahoj!"; got != want {
		t.Errorf("Handle = %q, chci %q", got, want)
	}
}

// Praktický důvod, proč tenhle vzor existuje: funkce beroucí interface
// pak umí přijmout i holou funkci (po konverzi), bez definování structu.
func TestHandlersAreInterchangeable(t *testing.T) {
	handlers := []Handler{
		HandlerFunc(strings.ToUpper),
		HandlerFunc(strings.ToLower),
	}

	want := []string{"MIXED", "mixed"}

	for i, h := range handlers {
		if got := h.Handle("MiXeD"); got != want[i] {
			t.Errorf("handler %d = %q, chci %q", i, got, want[i])
		}
	}
}

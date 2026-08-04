package exercise

import (
	"errors"
	"fmt"
	"testing"
)

// temp splňuje fmt.Stringer.
type temp float64

func (t temp) String() string { return fmt.Sprintf("%.1fC", float64(t)) }

// bothErrAndStringer splňuje ERROR i STRINGER — testuje pořadí větví.
type bothErrAndStringer struct{}

func (bothErrAndStringer) Error() string  { return "iam-error" }
func (bothErrAndStringer) String() string { return "iam-stringer" }

type unknownThing struct{ A int }

func TestDescribe(t *testing.T) {
	tests := []struct {
		name string
		in   any
		want string
	}{
		{"nil", nil, "nil"},
		{"int", 42, "int:42"},
		{"int zero", 0, "int:0"},
		{"string", "hello", "string:5"},
		{"empty string", "", "string:0"},
		{"slice", []int{1, 2, 3}, "slice:6"},
		{"empty slice", []int{}, "slice:0"},
		{"bool true", true, "bool:true"},
		{"bool false", false, "bool:false"},
		{"error", errors.New("boom"), "error:boom"},
		{"stringer", temp(21.5), "stringer:21.5C"},
		{"error wins over stringer", bothErrAndStringer{}, "error:iam-error"},
		{"unknown", unknownThing{A: 1}, "unknown:exercise.unknownThing"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := Describe(tc.in); got != tc.want {
				t.Errorf("Describe(%#v) = %q, chci %q", tc.in, got, tc.want)
			}
		})
	}
}

func TestDescribeOrderingHint(t *testing.T) {
	// Kdyby byla větev fmt.Stringer nad konkrétními typy, chytila by i tohle.
	if got := Describe(temp(1)); got != "stringer:1.0C" {
		t.Errorf("Describe(temp) = %q, chci %q", got, "stringer:1.0C")
	}
}

func TestStatusCode(t *testing.T) {
	// Chyby zabalené v několika vrstvách — přímé == / assertion neprojdou.
	wrappedNotFound := fmt.Errorf("service: %w", fmt.Errorf("repo: %w", ErrNotFound))
	wrappedHTTP := fmt.Errorf("api: %w", fmt.Errorf("call: %w", &HTTPError{Code: 503}))

	tests := []struct {
		name string
		err  error
		want int
	}{
		{"nil → 200", nil, 200},
		{"holý ErrNotFound", ErrNotFound, 404},
		{"zabalený ErrNotFound", wrappedNotFound, 404},
		{"holý HTTPError", &HTTPError{Code: 418}, 418},
		{"zabalený HTTPError", wrappedHTTP, 503},
		{"neznámá chyba", errors.New("kaboom"), 500},
		{"zabalená neznámá", fmt.Errorf("ctx: %w", errors.New("kaboom")), 500},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := StatusCode(tc.err); got != tc.want {
				t.Errorf("StatusCode(%v) = %d, chci %d\n"+
					"  (používáš errors.Is / errors.As, ne == a type assertion?)",
					tc.err, got, tc.want)
			}
		})
	}
}

func TestStatusCodeHTTPErrorWinsOverNotFound(t *testing.T) {
	// Řetěz obsahuje OBOJE: *HTTPError musí vyhrát.
	err := fmt.Errorf("outer: %w", fmt.Errorf("%w: %w", &HTTPError{Code: 502}, ErrNotFound))
	if got := StatusCode(err); got != 502 {
		t.Errorf("StatusCode = %d, chci 502 (*HTTPError má přednost před ErrNotFound)", got)
	}
}

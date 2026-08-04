package drill

import (
	"errors"
	"testing"
)

func TestValidateError(t *testing.T) {
	err := Validate("")
	if err == nil {
		t.Fatal("Validate(\"\") má vrátit chybu")
	}
	if got, want := err.Error(), "name: is required"; got != want {
		t.Errorf("Error() = %q, chci %q", got, want)
	}

	var ve *ValidationError
	if !errors.As(err, &ve) {
		t.Fatalf("chci *ValidationError, dostal jsem %T", err)
	}
}

// 🧨 Tady padá většina lidí.
func TestValidateReturnsRealNil(t *testing.T) {
	if err := Validate("olda"); err != nil {
		t.Fatalf("Validate(\"olda\") != nil — TYPED NIL!\n"+
			"  dynamický typ uvnitř interfacu: %T\n"+
			"  Vracíš proměnnou konkrétního typu místo explicitního `return nil`.", err)
	}
}

// TYPED NIL — nejzákeřnější bug v Go interfaces.
// Interface hodnota je pár (dynamický typ, dynamická hodnota).
// Je nil, JEN když jsou nil obě složky.
package main

import "fmt"

type MyErr struct{ Code int }

func (e *MyErr) Error() string { return fmt.Sprintf("boom (code=%d)", e.Code) }

// 🧨 ŠPATNĚ: vrací konkrétní pointer typ jako error.
func mayFailBad(fail bool) error {
	var e *MyErr // nil pointer typu *MyErr
	if fail {
		e = &MyErr{Code: 500}
	}
	return e // i když je e nil, interface dostane typ *MyErr → NENÍ nil!
}

// ✅ SPRÁVNĚ: nil se vrací explicitně jako nil.
func mayFailGood(fail bool) error {
	if !fail {
		return nil
	}
	return &MyErr{Code: 500}
}

func main() {
	fmt.Println("── ŠPATNĚ ──")
	err := mayFailBad(false) // nic neselhalo
	fmt.Printf("err == nil? %v\n", err == nil)
	fmt.Printf("  %%T = %T, hodnota uvnitř je nil\n", err)
	if err != nil {
		fmt.Println("  💥 vlezli jsme do error větve, i když nic neselhalo!")
	}

	fmt.Println("\n── SPRÁVNĚ ──")
	err = mayFailGood(false)
	fmt.Printf("err == nil? %v\n", err == nil)
	fmt.Printf("  %%T = %T\n", err)
	if err != nil {
		fmt.Println("  (sem se nedostaneme)")
	} else {
		fmt.Println("  ✅ error větev přeskočena, jak má být")
	}

	fmt.Println("\n── pravidlo ──")
	fmt.Println("Nikdy nevracej konkrétní pointer typ jako error/interface.")
	fmt.Println("Deklaruj návratovou hodnotu jako error a vracej explicitní nil.")
}

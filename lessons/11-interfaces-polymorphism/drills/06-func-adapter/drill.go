// DRILL 06 — funkce jako implementace interfacu (vzor http.HandlerFunc)
//
// Napiš:
//
//  1. interface Handler s metodou Handle(msg string) string
//  2. typ HandlerFunc — POJMENOVANÝ FUNKČNÍ TYP func(string) string
//  3. metodu na HandlerFunc, díky které HandlerFunc splňuje Handler
//     (metoda jen zavolá sama sebe jako funkci)
//
// Musí platit: `var h Handler = HandlerFunc(strings.ToUpper)`
//
// Sval: metoda se dá pověsit i na funkční typ — tím se z obyčejné funkce
// stane implementace interfacu. Přesně takhle funguje http.HandlerFunc.
//
//	go test ./lessons/11-interfaces-polymorphism/drills/06-func-adapter/
package drill

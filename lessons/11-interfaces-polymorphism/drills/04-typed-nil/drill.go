// DRILL 04 — správné vracení nil chyby (typed nil)
//
// Napiš:
//
//  1. typ ValidationError se stringovými poli Field a Msg
//     - splňuje error; Error() vrací "<Field>: <Msg>"
//  2. func Validate(name string) error
//     - prázdný name → &ValidationError{Field: "name", Msg: "is required"}
//     - jinak        → nil, a to tak, aby `Validate("x") == nil` bylo true 🧨
//
// Sval: nikdy nedeklarovat `var e *ValidationError` a vracet ji jako error.
//
//	go test ./lessons/11-interfaces-polymorphism/drills/04-typed-nil/
package drill

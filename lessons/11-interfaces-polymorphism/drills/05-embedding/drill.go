// DRILL 05 — embedding (composition místo dědičnosti)
//
// Napiš:
//
//  1. interface Loggable s metodou Log(msg string) string
//  2. typ Logger se stringovým polem Prefix
//     - Log(msg) vrací "<Prefix> <msg>"  (mezera mezi)
//  3. typ Service, který Logger EMBEDUJE (vloží bez jména) a má pole Name string
//     - Service NEDEKLARUJE vlastní Log — musí ho zdědit promocí
//
// Musí platit: `var l Loggable = Service{Logger: Logger{Prefix: "[svc]"}}`
//
// Sval: `type Service struct { Logger; Name string }` — vložení bez jména pole.
//
//	go test ./lessons/11-interfaces-polymorphism/drills/05-embedding/
package drill

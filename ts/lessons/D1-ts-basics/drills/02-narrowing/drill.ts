// DRILL 02 — narrowing: typeof, instanceof, null
//
// Napiš a exportuj:
//
//   function show(v: string | number | boolean | Date | null | undefined): string
//
//   null / undefined → "-"
//   string           → v oříznutý (trim); prázdný po trimu → "(empty)"
//   number           → 2 desetinná místa ("3.14"); NaN → "NaN"
//   boolean          → "yes" / "no"
//   Date             → "YYYY-MM-DD" (UTC, toISOString)
//
// Sval: typeof v === '...', v instanceof Date, v == null (chytá null i undefined —
// jediné místo, kde se `==` hodí).
//
//   npx jest lessons/D1-ts-basics/drills/02

// DRILL 05 — prefix sums
//
// Napiš:
//
//	type Prefix struct{ ... }
//	func NewPrefix(nums []int) *Prefix       // O(n) předpočet
//	func (p *Prefix) Sum(l, r int) int        // součet nums[l..r] včetně, O(1)
//
// Indexy jsou 0-based, l <= r, oba v rozsahu. Dotazů bude 10^6, takže Sum
// nesmí iterovat.
//
// Sval: pre má len(nums)+1 prvků, pre[i] = součet prvních i čísel,
// Sum(l, r) = pre[r+1] - pre[l]. Ta +1 je celé kouzlo — pak nemusíš řešit l == 0.
//
//	go test ./hackerrank/drills/05-prefix-sums/
package drill

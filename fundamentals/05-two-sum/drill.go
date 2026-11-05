// FUNDAMENTALS 05 — two sum na NESEŘAZENÉM poli
//
// Napiš:
//
//	func TwoSum(nums []int, target int) (i, j int, ok bool)
//
// Najdi indexy i < j, kde nums[i] + nums[j] == target.
// Víc řešení → vrať to s nejmenším j, a pro něj nejmenší i.
// Neexistuje → (0, 0, false). Musí být O(n), test to hlídá.
//
// Nahlas: čas O(?), paměť O(?). Rozdíl proti two pointers z drillu 03?
// Cíl: 3 min.
//
//	go test ./fundamentals/05-two-sum/
package drill

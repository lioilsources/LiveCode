package solution

// MinCoins vrátí nejmenší počet mincí (neomezená zásoba) na přesnou částku
// amount, nebo -1, pokud to nejde.
func MinCoins(coins []int, amount int) int {
	const inf = int(1e18)
	dp := make([]int, amount+1)
	for x := 1; x <= amount; x++ {
		dp[x] = inf
		for _, c := range coins {
			if c <= x && dp[x-c] != inf && dp[x-c]+1 < dp[x] {
				dp[x] = dp[x-c] + 1
			}
		}
	}
	if dp[amount] == inf {
		return -1
	}
	return dp[amount]
}

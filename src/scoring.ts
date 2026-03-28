// --- Scoring Helper Functions ---

// Calculates the variety bonus based on the balance of uncapped heart values.
export function calculateVarietyBonus(green: number, blue: number, red: number): number {
  const hearts = [green, blue, red];
  const sum = hearts.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;

  const maxHeart = Math.max(...hearts);
  const minHeart = Math.min(...hearts);

  // The bonus is 1 minus the ratio of the spread to the total, rewarding tighter groupings.
  const bonus = 1 - ((maxHeart - minHeart) / sum);
  return bonus;
}

// Calculates the total score for a town, including the variety bonus.
export function calculateTotalScore(green: number, blue: number, red: number, maxScore: number = 1000): number {
  const baseScore = Math.min(green, maxScore) + Math.min(blue, maxScore) + Math.min(red, maxScore);
  const varietyBonus = calculateVarietyBonus(green, blue, red);
  const totalScore = baseScore + (baseScore * varietyBonus);
  return totalScore;
}
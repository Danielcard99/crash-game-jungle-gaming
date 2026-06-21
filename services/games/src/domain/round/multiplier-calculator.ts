const GROWTH_RATE = 0.06;

export function calculateCurrentMultiplier(elapsedSeconds: number): number {
  if (elapsedSeconds < 0) {
    throw new Error("elapsedSeconds cannot be negative");
  }

  const multiplier = Math.pow(1 + GROWTH_RATE, elapsedSeconds);

  return Math.floor(multiplier * 100) / 100;
}

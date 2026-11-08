/**
 * Quintic ease-out deceleration curve for natural stage roulette wheel deceleration.
 * @param t Progress from 0 to 1
 */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Cubic ease-out curve
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

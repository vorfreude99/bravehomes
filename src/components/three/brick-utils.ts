/**
 * Brick maths lives outside BrickScene so the fallback and the copy
 * can use it without pulling three.js into the bundle.
 */

export const MAX_BRICKS = 140;

/**
 * £2 lays one brick. At £5 the default £20 selection drew four bricks in
 * a single row, which reads as nothing being built; this gives the tiers
 * a satisfying range — £10 is five bricks, £100 is a wall of fifty.
 */
export const POUNDS_PER_BRICK = 2;

export function bricksFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(MAX_BRICKS, Math.floor(amount / POUNDS_PER_BRICK));
}

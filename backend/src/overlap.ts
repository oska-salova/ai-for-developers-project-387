/**
 * Do the half-open intervals `[aStart, aEnd)` and `[bStart, bEnd)` intersect?
 * Touching ends do not overlap: a meeting may start exactly when the previous
 * one ends.
 */
export function intervalsOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && aEndMs > bStartMs;
}

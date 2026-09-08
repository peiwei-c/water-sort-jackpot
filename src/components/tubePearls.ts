/**
 * Display colors are top → bottom (reversed engine tube).
 * Pearls sit at the bottom of each unmerged color run.
 */
export function segmentShowsPearls(
  displayColors: readonly number[],
  displayIndex: number,
): boolean {
  const color = displayColors[displayIndex];
  if (color == null) return false;
  const below = displayColors[displayIndex + 1];
  return below == null || below !== color;
}

/**
 * Evenly spaced indices for sparse live SpotLights (cap GPU cost on long rails).
 */
export function pickSparseTrackIndices(total: number, maxLive: number): number[] {
  if (total <= 0 || maxLive <= 0) return [];
  if (total <= maxLive) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < maxLive; i++) {
    out.push(Math.round((i * (total - 1)) / (maxLive - 1)));
  }
  return [...new Set(out)];
}

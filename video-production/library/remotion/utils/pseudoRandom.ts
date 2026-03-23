// Origin: v9 IdentityScene — extracted to library 2026-03-23
// GLSL-inspired deterministic hash for frame-exact per-character randomness
export function pseudoRandom(seed: number): number {
  return Math.abs(((Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453) % 1));
}

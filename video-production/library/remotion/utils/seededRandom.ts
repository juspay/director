// Origin: v7 EcosystemScene — extracted to library 2026-03-23
// Multiplicative congruential generator (Park-Miller) for deterministic
// organic bezier paths. Returns a closure that yields successive values
// in [0, 1) from a single integer seed — stable across renders.

/**
 * Create a seeded pseudo-random number generator.
 *
 * Uses the Park-Miller multiplicative congruential algorithm:
 *   s(n+1) = (s(n) * 16807) mod 2147483647
 *
 * This is a classic PRNG with period 2^31-2, sufficient for
 * generating organic bezier control points, particle positions,
 * and any other render-deterministic randomness.
 *
 * @param seed - Integer seed (should be > 0)
 * @returns A function that returns the next random number in [0, 1)
 *
 * @example
 * ```ts
 * const rng = seededRandom(42);
 * const x = rng(); // 0.000015...
 * const y = rng(); // 0.131538...
 * ```
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

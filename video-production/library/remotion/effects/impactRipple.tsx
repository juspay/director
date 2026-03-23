/**
 * @effect ImpactRipple
 * @origin v5 — extracted 2026-03-23
 * @description Ripple wave math extracted from AnimatedDotGrid's reactive impact system.
 *   An expanding circular wave pushes nearby elements outward from an impact point.
 *   Wave expands at 20px/frame with an 80px influence band and directional push force.
 *
 *   This module exports pure math utilities — no rendering. Use these functions to
 *   calculate brightness boosts and positional offsets for any grid/particle system.
 *
 * Usage:
 *   import { computeImpactInfluence } from './impactRipple';
 *
 *   const { brightness, pushX, pushY } = computeImpactInfluence(
 *     elementX, elementY, impacts, currentFrame
 *   );
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImpactEvent {
  /** Absolute frame at which the impact occurs. */
  frame: number;
  /** X coordinate of the impact center. */
  x: number;
  /** Y coordinate of the impact center. */
  y: number;
  /** Maximum radius of influence in pixels.  Default: 600 */
  radius?: number;
  /** Intensity multiplier (1.0 = normal).  Default: 1.0 */
  intensity?: number;
}

export interface ImpactInfluence {
  /** Additional brightness to add to the element (0 = none). */
  brightness: number;
  /** Horizontal push offset in pixels. */
  pushX: number;
  /** Vertical push offset in pixels. */
  pushY: number;
}

// ── Core math ─────────────────────────────────────────────────────────────────

/** Default wave expansion speed in pixels per frame. */
export const WAVE_SPEED = 20;

/** Default influence band width in pixels (how wide the "ring" of effect is). */
export const INFLUENCE_BAND = 80;

/** Default total duration of a single impact ripple in frames. */
export const RIPPLE_DURATION = 45;

/** Default brightness contribution per unit of wave influence. */
export const BRIGHTNESS_PER_UNIT = 0.08;

/** Default push force multiplier. */
export const PUSH_FORCE = 3;

/**
 * Compute the wave influence factor for a single impact at a given point.
 *
 * The wave is a ring expanding outward at `waveSpeed` pixels/frame.
 * Points within `influenceBand` pixels of the ring's current radius
 * receive a linearly-interpolated influence value (1.0 at ring edge, 0 at band edge).
 *
 * @returns Influence factor in [0, 1], multiplied by decay and intensity.
 */
export function singleImpactWaveInfluence(
  elementX: number,
  elementY: number,
  impact: ImpactEvent,
  currentFrame: number,
  waveSpeed: number = WAVE_SPEED,
  influenceBand: number = INFLUENCE_BAND,
  rippleDuration: number = RIPPLE_DURATION,
): number {
  const age = currentFrame - impact.frame;
  if (age < 0 || age > rippleDuration) return 0;

  const intensity = impact.intensity ?? 1;

  const dx = elementX - impact.x;
  const dy = elementY - impact.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Expanding ring radius
  const waveRadius = age * waveSpeed;

  // How close is this element to the ring?
  const waveProximity = Math.abs(dist - waveRadius);
  if (waveProximity >= influenceBand) return 0;

  // Linear falloff within the band
  const bandInfluence = 1 - waveProximity / influenceBand;

  // Temporal decay: full intensity at age=0, zero at rippleDuration
  const decay = 1 - age / rippleDuration;

  return bandInfluence * decay * intensity;
}

/**
 * Compute the combined influence of multiple impact events on a single element.
 * Returns accumulated brightness boost and directional push offsets.
 *
 * This is the main function to use — it iterates all active impacts and sums
 * their contributions.
 */
export function computeImpactInfluence(
  elementX: number,
  elementY: number,
  impacts: ImpactEvent[],
  currentFrame: number,
  options: {
    waveSpeed?: number;
    influenceBand?: number;
    rippleDuration?: number;
    brightnessPerUnit?: number;
    pushForce?: number;
  } = {},
): ImpactInfluence {
  const {
    waveSpeed = WAVE_SPEED,
    influenceBand = INFLUENCE_BAND,
    rippleDuration = RIPPLE_DURATION,
    brightnessPerUnit = BRIGHTNESS_PER_UNIT,
    pushForce = PUSH_FORCE,
  } = options;

  let brightness = 0;
  let pushX = 0;
  let pushY = 0;

  for (const impact of impacts) {
    const age = currentFrame - impact.frame;
    if (age < 0 || age > rippleDuration) continue;

    const impactRadius = impact.radius ?? 600;
    const intensity = impact.intensity ?? 1;

    const dx = elementX - impact.x;
    const dy = elementY - impact.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Compute wave influence
    const waveRadius = age * waveSpeed;
    const waveProximity = Math.abs(dist - waveRadius);
    const waveInfluence =
      waveProximity < influenceBand
        ? 1 - waveProximity / influenceBand
        : 0;

    const waveDecay = 1 - age / rippleDuration;
    const effectiveInfluence = waveInfluence * waveDecay * intensity;

    // Accumulate brightness
    brightness += effectiveInfluence * brightnessPerUnit;

    // Accumulate directional push (outward from impact center)
    if (dist > 0 && dist < impactRadius) {
      const normalizedDx = dx / dist;
      const normalizedDy = dy / dist;
      const force = effectiveInfluence * pushForce;
      pushX += normalizedDx * force;
      pushY += normalizedDy * force;
    }
  }

  return { brightness, pushX, pushY };
}

/**
 * Quick check: is any impact currently active at the given frame?
 * Useful for early-out optimization before computing per-element influences.
 */
export function hasActiveImpact(
  impacts: ImpactEvent[],
  currentFrame: number,
  rippleDuration: number = RIPPLE_DURATION,
): boolean {
  return impacts.some((impact) => {
    const age = currentFrame - impact.frame;
    return age >= 0 && age <= rippleDuration;
  });
}

/**
 * Compute a global "rhythm pulse" factor for ambient breathing motion.
 * Returns a value oscillating around 1.0 (e.g., [0.85, 1.15]).
 * Extracted from AnimatedDotGrid's rhythm modulation.
 */
export function rhythmPulse(
  frame: number,
  frequency: number = 0.12,
  amplitude: number = 0.15,
): number {
  return Math.sin(frame * frequency) * amplitude + 1;
}

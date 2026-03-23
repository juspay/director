/**
 * @effect MorphTransitions
 * @origin v5 — extracted 2026-03-23
 * @description Six named morph transition spring configurations for force-based scene transitions.
 *   Each config drives a Remotion `spring()` call to produce physics-based enter/exit morphs.
 *   Also exports general-purpose spring presets and the MORPH_OVERLAP constant.
 *
 * Usage:
 *   import { spring } from 'remotion';
 *   import { MORPH_CONFIGS, MORPH_OVERLAP } from './morphTransitions';
 *
 *   const progress = spring({ frame, fps, config: MORPH_CONFIGS.implosion });
 */

// ── Core morph transition spring configs ──────────────────────────────────────
// Tuned for inter-scene force-based morphs.  Each one describes a distinct
// physical character:
//   - implosion : fast inward rush (Hook exit → elements collapse to center)
//   - starBirth : outward ripple with settle (MeetTara entrance — star burst)
//   - graphSnap : nodes sliding into position (Collab/Execution entrance)
//   - shatter   : plan card fracture (Payoff exit — content shatters outward)
//   - turbine   : spoke spin acceleration (Reach entrance — hub spins up)
//   - explosion : text/particle scatter (Identity entrance — elements fly out)

export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

export const MORPH_CONFIGS = {
  /** Fast inward rush — elements collapse toward a focal point. */
  implosion: { damping: 6, stiffness: 300, mass: 0.5 } as const,

  /** Outward ripple with gentle settle — energy radiates from a point. */
  starBirth: { damping: 10, stiffness: 180, mass: 0.8 } as const,

  /** Nodes sliding into a thread/grid layout — firm, professional snap. */
  graphSnap: { damping: 12, stiffness: 200, mass: 0.7 } as const,

  /** Card fracture / plan-split — sharp break with fast settle. */
  shatter: { damping: 8, stiffness: 250, mass: 0.5 } as const,

  /** Spoke spin-up — moderate resistance, accelerating rotation feel. */
  turbine: { damping: 6, stiffness: 200, mass: 0.6 } as const,

  /** Particle scatter / constellation explosion — heavy mass, slower settle. */
  explosion: { damping: 8, stiffness: 140, mass: 0.9 } as const,
} as const satisfies Record<string, SpringConfig>;

// ── Supporting spring presets ─────────────────────────────────────────────────
// General-purpose springs used alongside morphs inside scenes.

export const SPRING_PRESETS = {
  gentle: { damping: 14, stiffness: 120, mass: 0.8 } as const,
  snappy: { damping: 12, stiffness: 200, mass: 0.7 } as const,
  bouncy: { damping: 10, stiffness: 180, mass: 0.7 } as const,
  elastic: { damping: 8, stiffness: 160, mass: 0.8 } as const,
  smooth: { damping: 18, stiffness: 70, mass: 1.0 } as const,
  fork: { damping: 8, stiffness: 220, mass: 0.5 } as const,
  forkPushback: { damping: 10, stiffness: 250, mass: 0.8 } as const,
  pulse: { damping: 12, stiffness: 160, mass: 0.7 } as const,
  settle: { damping: 16, stiffness: 100, mass: 1.0 } as const,
} as const satisfies Record<string, SpringConfig>;

// ── Morph timing constant ─────────────────────────────────────────────────────
/**
 * Number of frames where adjacent scenes overlap for morph transitions.
 * During the overlap the outgoing scene's morph-out plays simultaneously
 * with the incoming scene's morph-in.  This is NOT a simple crossfade —
 * each morph uses its own physics config above.
 *
 * 45 frames @ 30 fps = 1.5 seconds.
 */
export const MORPH_OVERLAP = 45;

// ── Math helpers ──────────────────────────────────────────────────────────────

/**
 * Given a scene-relative frame, compute morph-in opacity (0 → 1).
 * Expects the scene's spring progress value (0 → 1).
 */
export function morphInOpacity(springProgress: number): number {
  return Math.min(Math.max(springProgress, 0), 1);
}

/**
 * Compute morph-out opacity for the last MORPH_OVERLAP frames of a scene.
 * Returns 1 before the exit window, fades linearly to 0 at scene end.
 */
export function morphOutOpacity(
  frame: number,
  sceneDuration: number,
  overlap: number = MORPH_OVERLAP,
): number {
  const exitStart = sceneDuration - overlap;
  if (frame <= exitStart) return 1;
  if (frame >= sceneDuration) return 0;
  return 1 - (frame - exitStart) / overlap;
}

/**
 * Build overlapping scene start-frames from an array of scene durations.
 * Each scene (except the first) starts MORPH_OVERLAP frames before
 * the previous scene ends.
 *
 * Returns { startFrame, durationFrames }[] in order.
 */
export function buildOverlappingSchedule(
  durations: number[],
  overlap: number = MORPH_OVERLAP,
): Array<{ startFrame: number; durationFrames: number }> {
  let cursor = 0;
  return durations.map((dur, i) => {
    const entry = { startFrame: cursor, durationFrames: dur };
    cursor += dur - (i < durations.length - 1 ? overlap : 0);
    return entry;
  });
}

export type MorphName = keyof typeof MORPH_CONFIGS;

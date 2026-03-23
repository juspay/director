// Origin: merged from v5 theme.ts (16 presets) + v8 theme.ts (4 presets) — extracted to library 2026-03-23
//
// All spring configs use Remotion's { damping, stiffness, mass } format.
// Where v5 and v8 both define a preset with the same name, the values are
// listed from both sources; the chosen value favours the more recent (v8)
// tuning for general-purpose presets, while v5's morph-specific presets
// are preserved verbatim since v8 never redefined them.

export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

// ── General-purpose presets ──────────────────────────────────────────────

/** Gentle — soft, floaty entrance for ambient elements */
// v5: { damping: 14, stiffness: 120, mass: 0.8 }
// v8: { damping: 20, stiffness: 80, mass: 0.8 }  ← more restrained, chosen
export const gentle: SpringConfig = { damping: 20, stiffness: 80, mass: 0.8 };

/** Snappy — quick settle for UI elements (badges, cards) */
// v5: { damping: 12, stiffness: 200, mass: 0.7 }
// v8: { damping: 15, stiffness: 200, mass: 0.5 }  ← lighter mass, chosen
export const snappy: SpringConfig = { damping: 15, stiffness: 200, mass: 0.5 };

/** Bouncy — playful overshoot for attention-drawing elements */
// v5: { damping: 10, stiffness: 180, mass: 0.7 }
// v8: { damping: 12, stiffness: 150, mass: 0.6 }  ← slightly more damped, chosen
export const bouncy: SpringConfig = { damping: 12, stiffness: 150, mass: 0.6 };

/** Elastic — rubber-band snap-back for interactive feedback */
// v5 only
export const elastic: SpringConfig = { damping: 8, stiffness: 160, mass: 0.8 };

/** Smooth — slow, heavy drift for background layer motion */
// v5 only
export const smooth: SpringConfig = { damping: 18, stiffness: 70, mass: 1.0 };

/** Slow — very overdamped, glacial ease for logo resolves and tagline holds */
// v8 only
export const slow: SpringConfig = { damping: 30, stiffness: 50, mass: 1.0 };

// ── Morph transition presets (v5) ────────────────────────────────────────
// These are physics-tuned for specific force-based scene transitions.
// Each name describes the physical metaphor.

/** Implosion — fast inward rush, particles collapsing to a point */
export const implosion: SpringConfig = { damping: 6, stiffness: 300, mass: 0.5 };

/** Star birth — outward ripple with gentle settle, like matter expanding after a bang */
export const starBirth: SpringConfig = { damping: 10, stiffness: 180, mass: 0.8 };

/** Graph snap — nodes sliding into a thread layout, snapping to grid */
export const graphSnap: SpringConfig = { damping: 12, stiffness: 200, mass: 0.7 };

/** Shape morph — circle-to-card transformation, smooth and deliberate */
export const shapemorph: SpringConfig = { damping: 14, stiffness: 150, mass: 0.8 };

/** Shatter — plan card fracture, fast breakup with light damping */
export const shatter: SpringConfig = { damping: 8, stiffness: 250, mass: 0.5 };

/** Fork — whip-like branch draw, snapping outward like a cracked whip */
export const fork: SpringConfig = { damping: 8, stiffness: 220, mass: 0.5 };

/** Fork push-back — counter-force after a fork snap, heavier settle */
export const forkPushback: SpringConfig = { damping: 10, stiffness: 250, mass: 0.8 };

/** Pulse — PR badge heartbeat, rhythmic with moderate overshoot */
export const pulse: SpringConfig = { damping: 12, stiffness: 160, mass: 0.7 };

/** Turbine — spoke spin acceleration, low damping for sustained momentum */
export const turbine: SpringConfig = { damping: 6, stiffness: 200, mass: 0.6 };

/** Explosion — text particle scatter, heavy mass for dramatic outward blast */
export const explosion: SpringConfig = { damping: 8, stiffness: 140, mass: 0.9 };

/** Settle — particles settling into constellation, heavily damped for calm landing */
export const settle: SpringConfig = { damping: 16, stiffness: 100, mass: 1.0 };

// ── Convenience lookup ──────────────────────────────────────────────────

export const SPRINGS = {
  // General-purpose
  gentle,
  snappy,
  bouncy,
  elastic,
  smooth,
  slow,
  // Morph transitions
  implosion,
  starBirth,
  graphSnap,
  shapemorph,
  shatter,
  fork,
  forkPushback,
  pulse,
  turbine,
  explosion,
  settle,
} as const;

// Origin: v5 — extracted to library 2026-03-23
//
// NOTE: This module pioneered the MORPH_OVERLAP scene overlap system.
// During the overlap region (MORPH_OVERLAP frames), adjacent scenes
// play simultaneously — the outgoing scene runs its morph-out animation
// while the incoming scene runs its morph-in. This is NOT a simple
// crossfade; each morph transition has its own physics (implosion,
// shatter, fork, pulse, etc.) driven by the spring presets in springs.ts.

export const FPS = 30;

// REAL durations measured via ffprobe + 0.5s breathing room per segment
// Continuous take: 176.24s (~2:56). Individual segments sum: ~159.66s + breathing = ~163.2s
export const DURATIONS_SEC = {
  seg1_hook: 25.5,        // ffprobe: 24.96s + 0.5s breathing
  seg2_tara: 30.5,        // ffprobe: 29.84s + 0.5s breathing
  seg3_collab: 31.7,      // ffprobe: 31.20s + 0.5s breathing
  seg4_execute: 26.0,     // ffprobe: 25.44s + 0.5s breathing
  seg5_reach: 26.3,       // ffprobe: 25.84s + 0.5s breathing
  seg6_payoff: 6.3,       // ffprobe: 5.84s + 0.5s breathing
  seg7_identity: 17.0,    // ffprobe: 16.56s + 0.5s breathing
} as const;
// Total with breathing: ~163.3s (~2:43). With morph overlaps (6 x 1.5s = 9s): ~154.3s (~2:34)

export const DURATIONS_FRAMES = Object.fromEntries(
  Object.entries(DURATIONS_SEC).map(([k, v]) => [k, Math.ceil(v * FPS)])
) as Record<keyof typeof DURATIONS_SEC, number>;

export interface SceneEntry {
  id: string;
  startFrame: number;
  durationFrames: number;
}

const sceneOrder = [
  'seg1_hook',
  'seg2_tara',
  'seg3_collab',
  'seg4_execute',
  'seg5_reach',
  'seg6_payoff',
  'seg7_identity',
] as const;

/**
 * MORPH_OVERLAP — frames where adjacent scenes overlap for morph transitions.
 * During the overlap, the outgoing scene's morph-out animation plays simultaneously
 * with the incoming scene's morph-in animation. This is NOT a simple crossfade —
 * each morph has its own physics (implosion, shatter, pulse, etc.)
 */
export const MORPH_OVERLAP = 45; // ~1.5s overlap for force-based morphs

let cursor = 0;
export const SCENES: SceneEntry[] = sceneOrder.map((id, index) => {
  const durationFrames = DURATIONS_FRAMES[id];
  const entry: SceneEntry = { id, startFrame: cursor, durationFrames };
  // Each scene after the first starts MORPH_OVERLAP frames before the
  // previous scene ends, creating the overlap region for morph transitions.
  cursor += durationFrames - (index < sceneOrder.length - 1 ? MORPH_OVERLAP : 0);
  return entry;
});

export const TOTAL_FRAMES = cursor;

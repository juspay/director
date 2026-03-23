// Origin: v7 — extracted to library 2026-03-23
import { videoConfig } from "../styles/theme";

const { fps } = videoConfig;

// Convert seconds to frames
export function s(seconds: number): number {
  return Math.round(seconds * fps);
}

// Convert frames to seconds
export function toSeconds(frames: number): number {
  return frames / fps;
}

// Scene timing map — derived from script v7.4 production notes
// Each entry: [startFrame, durationInFrames]
export const sceneTiming = {
  // 0:00-0:08 — Tabs accumulation, amber idea buried
  opening: { start: s(0), duration: s(8) },

  // 0:08-0:15 — Two points of light, gap visualization
  gap: { start: s(8), duration: s(7) },

  // 0:15-0:25 — Code scrolling to architecture diagrams
  history: { start: s(15), duration: s(10) },

  // 0:25-0:30 — "Carrying the weight" amber throb
  weight: { start: s(25), duration: s(5) },

  // 0:30-0:42 — Thesis: gap pulses, amber line connects
  thesis: { start: s(30), duration: s(12) },

  // 0:42-0:55 — Slack thread, Tara activation, investigation
  slackThread: { start: s(42), duration: s(13) },

  // 0:55-1:15 — PM/Engineer/Designer collaboration
  collaboration: { start: s(55), duration: s(20) },

  // 1:15-1:32 — Plan locks, delta, parallel PRs
  execution: { start: s(75), duration: s(17) },

  // 1:32-1:50 — Ecosystem connections
  ecosystem: { start: s(92), duration: s(18) },

  // 1:50-2:00 — Kinetic typography metrics
  metrics: { start: s(110), duration: s(10) },

  // 2:00-2:05 — "Engineers are builders now." title card
  titleCard: { start: s(120), duration: s(5) },

  // 2:05-2:30 — Constellation forming, connecting
  constellation: { start: s(125), duration: s(25) },

  // 2:30-2:40 — "Tara. Build what matters." logo resolve
  tagline: { start: s(150), duration: s(20) },
} as const;

// Total duration from scene map
export const totalDuration = s(170);

// BPM at a given timestamp (seconds) — for sync reference
export function bpmAt(seconds: number): number {
  if (seconds < 30) return 72;
  if (seconds < 35) return 72 + ((seconds - 30) / 5) * 2; // 72->74
  if (seconds < 42) return 74 + ((seconds - 35) / 7) * 2; // 74->76
  if (seconds < 55) return 76 + ((seconds - 42) / 13) * 4; // 76->80
  if (seconds < 63) return 80 + ((seconds - 55) / 8) * 2; // 80->82
  if (seconds < 75) return 82 + ((seconds - 63) / 12) * 2; // 82->84
  if (seconds < 90) return 84 + ((seconds - 75) / 15) * 4; // 84->88
  if (seconds < 92) return 88 - ((seconds - 90) / 2) * 2; // 88->86
  if (seconds < 110) return 86 - ((seconds - 92) / 18) * 2; // 86->84
  if (seconds < 120) return 84 - ((seconds - 110) / 10) * 4; // 84->80
  if (seconds < 125) return 80 - ((seconds - 120) / 5) * 4; // 80->76
  if (seconds < 150) return 76 - ((seconds - 125) / 25) * 4; // 76->72
  return 72;
}

// Beat duration in frames at a given BPM
export function beatFrames(bpm: number): number {
  return Math.round((60 / bpm) * fps);
}

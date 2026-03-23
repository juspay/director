// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring } from "remotion";
import { videoConfig } from "../styles/theme";
import {
  smoothEase,
  gentleFade,
  weightedEase,
  snapEase,
  throb,
  pulse,
} from "../utils/easing";
import { s, beatFrames, bpmAt, toSeconds } from "../utils/timing";

const { fps } = videoConfig;

// ---- Types ----

export interface PulseState {
  /** Intensity 0-1 */
  intensity: number;
  /** Scale multiplier (1 = no change) */
  scale: number;
  /** Glow radius in px */
  glowRadius: number;
  /** Color opacity override */
  colorOpacity: number;
}

export interface FlareState {
  /** Brightness multiplier (1 = normal, >1 = flaring) */
  brightness: number;
  /** Glow expansion in px */
  glowExpansion: number;
  /** Duration progress 0-1 */
  progress: number;
}

export interface IntensifyState {
  /** Per-point intensities */
  leftIntensity: number;
  rightIntensity: number;
  /** Combined gap field intensity */
  fieldIntensity: number;
}

export interface PlanLockState {
  /** Lock snap progress (spring-based) */
  lockProgress: number;
  /** Glow ring radius */
  glowRadius: number;
  /** Glow opacity */
  glowOpacity: number;
  /** Border solidification */
  borderOpacity: number;
  /** Scale — slight overshoot on lock */
  scale: number;
}

// ---- Animation Functions ----

/**
 * Single slow amber throb.
 * Used during "carrying the weight" — architecture diagram pulses warm.
 * One full cycle: rest → glow → rest. Weighted ease for heaviness.
 *
 * The throb is synchronized to the current BPM for musical alignment.
 */
export function amberPulse(
  frame: number,
  config: {
    /** Start frame of the pulse */
    startFrame?: number;
    /** Number of throb cycles */
    cycles?: number;
    /** Override BPM (otherwise derived from frame position) */
    bpm?: number;
    /** Maximum glow radius */
    maxGlowRadius?: number;
    /** Maximum scale expansion */
    maxScaleExpansion?: number;
  } = {}
): PulseState {
  const start = config.startFrame ?? 0;
  const cycles = config.cycles ?? 2;
  const maxGlow = config.maxGlowRadius ?? 60;
  const maxScale = config.maxScaleExpansion ?? 0.06;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return { intensity: 0, scale: 1, glowRadius: 0, colorOpacity: 0 };
  }

  // Derive BPM from timing position or use override
  const currentBpm = config.bpm ?? bpmAt(toSeconds(frame));
  const cycleFrames = beatFrames(currentBpm) * 2; // one throb = 2 beats
  const totalDuration = cycleFrames * cycles;

  if (localFrame >= totalDuration) {
    // After all cycles, settle to warm residual
    const fadeOut = interpolate(
      localFrame - totalDuration,
      [0, s(1)],
      [0.3, 0],
      { extrapolateRight: "clamp", easing: gentleFade }
    );
    return {
      intensity: fadeOut,
      scale: 1 + fadeOut * maxScale * 0.3,
      glowRadius: fadeOut * maxGlow * 0.3,
      colorOpacity: fadeOut * 0.4,
    };
  }

  // Weighted throb — heavier on the rise, slower on the fall
  const t = (localFrame % cycleFrames) / cycleFrames;

  // Custom weighted sine: faster attack (0→peak in 35%), slower decay (peak→0 in 65%)
  let intensity: number;
  if (t < 0.35) {
    // Rise phase — cubic ease-in
    const riseT = t / 0.35;
    intensity = riseT * riseT * riseT;
  } else {
    // Fall phase — smooth ease-out
    const fallT = (t - 0.35) / 0.65;
    intensity = 1 - fallT * fallT;
  }

  // Envelope: first cycle is strongest, subsequent ones diminish
  const cycleIndex = Math.floor(localFrame / cycleFrames);
  const envelope = 1 - cycleIndex * (0.3 / cycles);
  intensity *= envelope;

  return {
    intensity,
    scale: 1 + intensity * maxScale,
    glowRadius: intensity * maxGlow,
    colorOpacity: intensity * 0.7 + 0.1,
  };
}

/**
 * Brief 0.3s brightness flare.
 * Used at "this morning" — amber idea remembers its brightness.
 * Sharp attack, smooth decay. Frame-accurate 9-frame duration.
 */
export function amberFlare(
  frame: number,
  config: {
    /** Frame at which the flare triggers */
    triggerFrame?: number;
    /** Peak brightness multiplier */
    peakBrightness?: number;
    /** Peak glow expansion in px */
    peakGlow?: number;
  } = {}
): FlareState {
  const trigger = config.triggerFrame ?? 0;
  const peakBright = config.peakBrightness ?? 2.5;
  const peakGlow = config.peakGlow ?? 45;
  const localFrame = frame - trigger;
  const duration = s(0.3); // 9 frames at 30fps

  if (localFrame < 0 || localFrame > duration + s(0.2)) {
    return { brightness: 1, glowExpansion: 0, progress: localFrame < 0 ? 0 : 1 };
  }

  const progress = localFrame / duration;

  // Sharp attack to 30% of duration, smooth decay for remaining 70%
  const attackEnd = 0.3;
  let brightness: number;
  if (progress <= attackEnd) {
    // Quadratic ease-in for sharp attack
    const t = progress / attackEnd;
    brightness = 1 + (peakBright - 1) * t * t;
  } else {
    // Cubic ease-out for smooth decay
    const t = (progress - attackEnd) / (1 - attackEnd);
    const decay = 1 - t;
    brightness = 1 + (peakBright - 1) * decay * decay * decay;
  }

  // Glow follows brightness with slight lag
  const glowProgress = Math.min(1, progress * 1.1); // glow slightly ahead
  const glowExpansion = interpolate(
    glowProgress,
    [0, attackEnd, 1],
    [0, peakGlow, 0],
    { extrapolateRight: "clamp" }
  );

  return { brightness, glowExpansion, progress: Math.min(1, progress) };
}

/**
 * Gap points brightening — both Decision (left) and Done (right) intensify.
 * "The friction isn't in your skill. It's between the decision and the done."
 * Points pulse in opposition, then synchronize at peak tension.
 */
export function pointIntensify(
  frame: number,
  config: {
    startFrame?: number;
    /** Duration of the intensification ramp */
    rampDuration?: number;
    /** Peak intensity at the end of ramp */
    peakIntensity?: number;
  } = {}
): IntensifyState {
  const start = config.startFrame ?? 0;
  const rampDur = config.rampDuration ?? s(3);
  const peak = config.peakIntensity ?? 1;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return { leftIntensity: 0.4, rightIntensity: 0.4, fieldIntensity: 0 };
  }

  const rampProgress = interpolate(localFrame, [0, rampDur], [0, 1], {
    extrapolateRight: "clamp",
    easing: weightedEase,
  });

  // Points pulse in slight opposition initially, then synchronize
  const phaseOffset = interpolate(localFrame, [0, rampDur], [Math.PI * 0.5, 0], {
    extrapolateRight: "clamp",
  });

  const pulseFreq = 0.08; // slow pulse
  const leftPulse = Math.sin(localFrame * pulseFreq) * 0.15;
  const rightPulse = Math.sin(localFrame * pulseFreq + phaseOffset) * 0.15;

  const baseIntensity = 0.4 + rampProgress * (peak - 0.4);

  // Field between the two points — electromagnetic-like tension
  const fieldIntensity = rampProgress * 0.6 * (1 + Math.sin(localFrame * pulseFreq * 2) * 0.2);

  return {
    leftIntensity: Math.min(1, baseIntensity + leftPulse),
    rightIntensity: Math.min(1, baseIntensity + rightPulse),
    fieldIntensity,
  };
}

/**
 * Plan visualization locking into place with amber glow.
 * "When it's ready — it moves." — the plan solidifies.
 * Spring-based snap with overshoot, followed by glow ring.
 */
export function planLock(
  frame: number,
  config: {
    triggerFrame?: number;
    /** Glow ring max radius */
    maxGlowRadius?: number;
  } = {}
): PlanLockState {
  const trigger = config.triggerFrame ?? 0;
  const maxGlow = config.maxGlowRadius ?? 40;
  const localFrame = frame - trigger;

  if (localFrame < 0) {
    return {
      lockProgress: 0,
      glowRadius: 0,
      glowOpacity: 0,
      borderOpacity: 0.3,
      scale: 0.95,
    };
  }

  // Spring snap with slight overshoot — feels decisive
  const lockProgress = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 14,       // Low damping = visible overshoot
      stiffness: 200,    // High stiffness = fast snap
      mass: 0.6,         // Low mass = responsive
    },
  });

  // Glow ring expands on lock, then settles
  const glowRadius = interpolate(
    localFrame,
    [0, s(0.3), s(0.8), s(2)],
    [0, maxGlow * 1.2, maxGlow, maxGlow * 0.6],
    { extrapolateRight: "clamp", easing: smoothEase }
  );

  const glowOpacity = interpolate(
    localFrame,
    [0, s(0.2), s(0.5), s(2)],
    [0, 0.9, 0.7, 0.4],
    { extrapolateRight: "clamp", easing: gentleFade }
  );

  // Border solidifies from translucent to solid
  const borderOpacity = interpolate(
    localFrame,
    [0, s(0.3)],
    [0.3, 1],
    { extrapolateRight: "clamp", easing: snapEase }
  );

  // Scale: slight overshoot via spring, already handled by lockProgress
  const scale = interpolate(lockProgress, [0, 0.5, 1, 1.05], [0.95, 0.98, 1.02, 1], {
    extrapolateRight: "clamp",
  });

  return { lockProgress, glowRadius, glowOpacity, borderOpacity, scale };
}

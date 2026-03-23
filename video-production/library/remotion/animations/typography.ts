// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring } from "remotion";
import { videoConfig } from "../styles/theme";
import { gentleFade, dissolveEase, smoothEase, dramaticEase } from "../utils/easing";
import { s } from "../utils/timing";

const { fps } = videoConfig;

// ---- Types ----

export interface TextRevealState {
  opacity: number;
  y: number;
  scale: number;
  blur: number;
}

export interface DissolveRevealState {
  /** Per-character or per-word opacity */
  elementOpacities: number[];
  /** Overall group opacity */
  groupOpacity: number;
  /** Y offset for the whole group */
  y: number;
}

export interface HardCutState {
  /** 0 or 1 — instant appearance */
  visible: number;
  /** Hold duration progress 0-1 */
  holdProgress: number;
  /** Exit opacity for fade-out */
  exitOpacity: number;
}

export interface ParticleDissolveState {
  /** How far the dissolve has progressed (0 = solid text, 1 = fully particles) */
  dissolveProgress: number;
  /** Per-particle states — positions relative to original, opacity, scale */
  particles: Array<{
    offsetX: number;
    offsetY: number;
    opacity: number;
    scale: number;
  }>;
  /** Overall text opacity (inverse of dissolve for crossfade) */
  textOpacity: number;
}

// ---- Animation Functions ----

/**
 * Text fade-in with slight upward motion.
 * The standard text reveal: opacity ramps while text lifts 20px.
 * Gentle, unhurried — matches the patient tone of the video.
 */
export function fadeReveal(
  frame: number,
  config: {
    startFrame?: number;
    /** Fade-in duration in frames */
    fadeInDuration?: number;
    /** Optional hold duration before fade-out */
    holdDuration?: number;
    /** Optional fade-out duration */
    fadeOutDuration?: number;
    /** Y offset distance in px */
    yOffset?: number;
    /** Include subtle scale change */
    scaleFrom?: number;
  } = {}
): TextRevealState {
  const start = config.startFrame ?? 0;
  const fadeIn = config.fadeInDuration ?? s(0.6);
  const hold = config.holdDuration ?? s(2);
  const fadeOut = config.fadeOutDuration ?? s(0.4);
  const yOff = config.yOffset ?? 20;
  const scaleFrom = config.scaleFrom ?? 0.98;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return { opacity: 0, y: yOff, scale: scaleFrom, blur: 2 };
  }

  const totalVisible = fadeIn + hold + fadeOut;

  // Opacity: in → hold → out
  const opacity = interpolate(
    localFrame,
    [0, fadeIn, fadeIn + hold, totalVisible],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", easing: gentleFade }
  );

  // Y position: rises during fade-in, holds, stays during fade-out
  const y = interpolate(localFrame, [0, fadeIn], [yOff, 0], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Scale
  const scale = interpolate(localFrame, [0, fadeIn], [scaleFrom, 1], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Subtle blur during entry
  const blur = interpolate(localFrame, [0, fadeIn * 0.6], [2, 0], {
    extrapolateRight: "clamp",
  });

  return { opacity, y, scale, blur };
}

/**
 * Sequential dissolve for metrics display.
 * "400+" → "2x PRs" → "Minutes, not days" — each appears and dissolves.
 * Used in T7 metrics phase. Elements dissolve one at a time with overlap.
 */
export function dissolveReveal(
  frame: number,
  config: {
    startFrame?: number;
    /** Number of elements to reveal sequentially */
    elementCount?: number;
    /** Duration each element is visible */
    elementDuration?: number;
    /** Overlap between elements in frames */
    overlap?: number;
  } = {}
): DissolveRevealState {
  const start = config.startFrame ?? 0;
  const count = config.elementCount ?? 3;
  const elemDur = config.elementDuration ?? s(3);
  const overlap = config.overlap ?? s(0.3);
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      elementOpacities: new Array(count).fill(0),
      groupOpacity: 0,
      y: 10,
    };
  }

  const stepDuration = elemDur - overlap;

  const elementOpacities = Array.from({ length: count }, (_, i) => {
    const elemStart = i * stepDuration;
    const elemEnd = elemStart + elemDur;
    const elemLocal = localFrame - elemStart;

    if (elemLocal < 0 || elemLocal > elemDur) return 0;

    // Fade in over 15%, hold 55%, fade out over 30%
    const fadeInEnd = elemDur * 0.15;
    const holdEnd = elemDur * 0.70;

    return interpolate(
      elemLocal,
      [0, fadeInEnd, holdEnd, elemDur],
      [0, 1, 1, 0],
      { extrapolateRight: "clamp", easing: dissolveEase }
    );
  });

  // Group opacity: visible while any element is showing
  const anyVisible = elementOpacities.some((o) => o > 0);
  const groupOpacity = anyVisible ? 1 : 0;

  // Subtle Y offset
  const y = interpolate(localFrame, [0, s(0.5)], [10, 0], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  return { elementOpacities, groupOpacity, y };
}

/**
 * Instant appearance for the title card.
 * "Engineers are builders now." — HARD FORMAT BREAK.
 * No fade-in. Full-screen white serif on dark navy. 2.5s hold.
 * Only serif moment in the entire video.
 */
export function hardCut(
  frame: number,
  config: {
    triggerFrame?: number;
    /** Hold duration */
    holdDuration?: number;
    /** Fade-out duration after hold */
    fadeOutDuration?: number;
  } = {}
): HardCutState {
  const trigger = config.triggerFrame ?? 0;
  const hold = config.holdDuration ?? s(2.5);
  const fadeOutDur = config.fadeOutDuration ?? s(0.3);
  const localFrame = frame - trigger;

  if (localFrame < 0) {
    return { visible: 0, holdProgress: 0, exitOpacity: 0 };
  }

  // Instant on — no interpolation, no spring, no ease. Hard cut.
  const visible = 1;

  const holdProgress = interpolate(localFrame, [0, hold], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Exit: fade out after hold
  const exitOpacity = localFrame <= hold
    ? 1
    : interpolate(localFrame - hold, [0, fadeOutDur], [1, 0], {
        extrapolateRight: "clamp",
        easing: gentleFade,
      });

  return { visible, holdProgress, exitOpacity };
}

/**
 * Text dissolving into particles that reform as amber dots.
 * "You already know what to build next." → text breaks apart.
 * Each character/word becomes particles that drift and reform.
 *
 * Generates N particles with deterministic pseudo-random trajectories.
 */
export function particleDissolve(
  frame: number,
  config: {
    startFrame?: number;
    /** Number of particles to generate */
    particleCount?: number;
    /** Duration of the dissolve effect */
    dissolveDuration?: number;
    /** Maximum particle drift distance */
    maxDrift?: number;
    /** Seed for deterministic randomness */
    seed?: number;
  } = {}
): ParticleDissolveState {
  const start = config.startFrame ?? 0;
  const count = config.particleCount ?? 40;
  const duration = config.dissolveDuration ?? s(2);
  const maxDrift = config.maxDrift ?? 200;
  const seed = config.seed ?? 42;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      dissolveProgress: 0,
      particles: [],
      textOpacity: 1,
    };
  }

  const dissolveProgress = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateRight: "clamp",
    easing: dissolveEase,
  });

  // Text fades as particles appear
  const textOpacity = interpolate(dissolveProgress, [0, 0.3, 0.6], [1, 0.5, 0], {
    extrapolateRight: "clamp",
  });

  // Deterministic pseudo-random number generator (mulberry32)
  function mulberry32(a: number): () => number {
    return () => {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(seed);

  const particles = Array.from({ length: count }, (_, i) => {
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();
    const r4 = rand();

    // Each particle has a delay before it starts moving
    const particleDelay = r1 * 0.4; // 0-40% delay
    const particleProgress = interpolate(
      dissolveProgress,
      [particleDelay, particleDelay + 0.5],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Drift direction — unique per particle
    const angle = r2 * Math.PI * 2;
    const distance = (0.3 + r3 * 0.7) * maxDrift * particleProgress;

    // Quadratic drift for natural deceleration
    const easeProgress = 1 - (1 - particleProgress) * (1 - particleProgress);

    const offsetX = Math.cos(angle) * distance * easeProgress;
    const offsetY = Math.sin(angle) * distance * easeProgress - particleProgress * 30; // slight upward bias

    // Opacity: each particle fades at different rate
    const fadeStart = 0.3 + r4 * 0.4;
    const opacity = interpolate(
      particleProgress,
      [0, 0.1, fadeStart, 1],
      [0, 1, 0.8, 0],
      { extrapolateRight: "clamp" }
    );

    // Scale: particles shrink as they drift
    const scale = interpolate(particleProgress, [0, 0.5, 1], [1, 0.6, 0.2], {
      extrapolateRight: "clamp",
    });

    return { offsetX, offsetY, opacity, scale };
  });

  return { dissolveProgress, particles, textOpacity };
}

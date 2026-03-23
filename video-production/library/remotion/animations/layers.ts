// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring, Easing } from "remotion";
import { videoConfig } from "../styles/theme";
import { smoothEase, gentleFade, weightedEase, staggerDelay } from "../utils/easing";
import { s } from "../utils/timing";

const { fps } = videoConfig;

// ---- Types ----

export interface LayerState {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
}

export interface LayerAccumulationResult {
  layers: LayerState[];
  amberOpacity: number;
}

export interface SettleResult {
  layers: LayerState[];
}

// ---- Constants ----

const LAYER_COUNT = 5;
const STAGGER_FRAMES = s(0.4); // 12 frames at 30fps
const LAYER_BASE_WIDTH = 320;
const LAYER_BASE_HEIGHT = 48;

/**
 * Staggered gray rectangles drifting over the amber shape.
 * Each layer enters from a slightly different angle with 0.4s stagger,
 * simulating accumulation of tabs/context/clutter over the central idea.
 *
 * Returns per-layer transform state and the diminishing amber opacity.
 */
export function staggeredLayers(
  frame: number,
  config: {
    layerCount?: number;
    staggerFrames?: number;
    centerX?: number;
    centerY?: number;
    driftRange?: number;
  } = {}
): LayerAccumulationResult {
  const count = config.layerCount ?? LAYER_COUNT;
  const stagger = config.staggerFrames ?? STAGGER_FRAMES;
  const cx = config.centerX ?? 960;
  const cy = config.centerY ?? 540;
  const drift = config.driftRange ?? 200;

  const layers: LayerState[] = [];
  let coveredCount = 0;

  for (let i = 0; i < count; i++) {
    const delay = staggerDelay(i, stagger);
    const localFrame = frame - delay;

    if (localFrame < 0) {
      layers.push({ x: cx, y: cy - drift - 100, opacity: 0, scale: 0.9, rotation: 0 });
      continue;
    }

    // Each layer drifts in from a slightly different direction
    const angle = ((i * 37 + 15) % 360) * (Math.PI / 180);
    const startX = cx + Math.cos(angle) * (drift + 150);
    const startY = cy + Math.sin(angle) * (drift + 100);

    // Settle position: stacked near center with slight offset
    const settleX = cx + (i - count / 2) * 12;
    const settleY = cy + (i - count / 2) * 14 - 20;

    const enterDuration = s(0.8);

    const x = interpolate(localFrame, [0, enterDuration], [startX, settleX], {
      extrapolateRight: "clamp",
      easing: smoothEase,
    });

    const y = interpolate(localFrame, [0, enterDuration], [startY, settleY], {
      extrapolateRight: "clamp",
      easing: smoothEase,
    });

    const opacity = interpolate(localFrame, [0, enterDuration * 0.6], [0, 0.7], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    const scale = interpolate(localFrame, [0, enterDuration], [0.85, 1], {
      extrapolateRight: "clamp",
      easing: smoothEase,
    });

    // Slight rotation variation per layer
    const rotationTarget = (i % 2 === 0 ? 1 : -1) * (2 + i * 0.5);
    const rotation = interpolate(localFrame, [0, enterDuration], [rotationTarget * 3, rotationTarget], {
      extrapolateRight: "clamp",
      easing: smoothEase,
    });

    layers.push({ x, y, opacity, scale, rotation });

    if (localFrame > 0) coveredCount++;
  }

  // Amber dims as layers accumulate — exponential dimming
  const amberOpacity = interpolate(
    coveredCount,
    [0, 1, 2, 3, count],
    [1, 0.7, 0.45, 0.25, 0.08],
    { extrapolateRight: "clamp" }
  );

  return { layers, amberOpacity };
}

/**
 * Layers settling into final resting position.
 * Used in T2 transition: gray layers stop drifting, become static.
 * Returns settled positions with subtle breathing motion.
 */
export function layerSettle(
  frame: number,
  config: {
    layerCount?: number;
    settleDuration?: number;
    centerX?: number;
    centerY?: number;
  } = {}
): SettleResult {
  const count = config.layerCount ?? LAYER_COUNT;
  const duration = config.settleDuration ?? s(1.5);
  const cx = config.centerX ?? 960;
  const cy = config.centerY ?? 540;

  const layers: LayerState[] = [];

  for (let i = 0; i < count; i++) {
    // Settle toward center with micro-spring
    const springVal = spring({
      frame,
      fps,
      config: {
        damping: 20,
        stiffness: 80,
        mass: 1.2 + i * 0.15,
      },
    });

    const settleX = cx + (i - count / 2) * 10 * (1 - springVal * 0.3);
    const settleY = cy + (i - count / 2) * 12 * (1 - springVal * 0.2);

    // Subtle breathing: very slow, very small
    const breathe = Math.sin(frame * 0.02 + i * 0.7) * 0.005;

    const opacity = interpolate(frame, [0, duration], [0.7, 0.5], {
      extrapolateRight: "clamp",
      easing: gentleFade,
    });

    layers.push({
      x: settleX,
      y: settleY,
      opacity,
      scale: 1 + breathe,
      rotation: (i % 2 === 0 ? 1 : -1) * (1.5 + i * 0.3) * (1 - springVal * 0.5),
    });
  }

  return { layers };
}

/**
 * Amber idea fading/dimming under accumulated layers.
 * Returns the amber shape's opacity and glow intensity as it gets buried.
 * Used throughout the opening scene as layers pile on.
 */
export function fadeToBackground(
  frame: number,
  config: {
    startFrame?: number;
    fadeDuration?: number;
    minOpacity?: number;
  } = {}
): { opacity: number; glowIntensity: number; scale: number } {
  const start = config.startFrame ?? 0;
  const duration = config.fadeDuration ?? s(6);
  const min = config.minOpacity ?? 0.06;
  const localFrame = frame - start;

  if (localFrame < 0) {
    return { opacity: 1, glowIntensity: 1, scale: 1 };
  }

  // Non-linear fade: fast at first then slowing — the idea resists being buried
  const opacity = interpolate(localFrame, [0, duration * 0.4, duration], [1, 0.3, min], {
    extrapolateRight: "clamp",
    easing: weightedEase,
  });

  // Glow shrinks faster than opacity — radiance dies first
  const glowIntensity = interpolate(localFrame, [0, duration * 0.3, duration], [1, 0.15, 0.03], {
    extrapolateRight: "clamp",
    easing: smoothEase,
  });

  // Slight scale reduction as the idea is compressed
  const scale = interpolate(localFrame, [0, duration], [1, 0.92], {
    extrapolateRight: "clamp",
    easing: gentleFade,
  });

  return { opacity, glowIntensity, scale };
}

// Origin: v7 animations library — extracted to library on 2026-03-23
import { interpolate, spring } from "remotion";
import { videoConfig } from "../styles/theme";
import { smoothEase, gentleFade, dramaticEase } from "../utils/easing";
import { s, sceneTiming } from "../utils/timing";

const { fps, width, height } = videoConfig;

// ---- Types ----

export interface CameraState {
  /** Zoom level (1 = 100%, 0.75 = 75% zoom, 1.2 = 120% zoom) */
  zoom: number;
  /** X translation of the viewport */
  translateX: number;
  /** Y translation of the viewport */
  translateY: number;
  /** Combined CSS transform string */
  transform: string;
}

export interface FocusShiftState {
  /** Where the viewer's attention should be (normalized 0-1 across viewport) */
  focusX: number;
  focusY: number;
  /** Vignette intensity around the focus point (0 = none, 1 = strong) */
  vignetteIntensity: number;
  /** Depth-of-field blur for non-focus elements */
  defocusBlur: number;
  /** CSS radial gradient for vignette overlay */
  vignetteGradient: string;
}

export interface ViewportExpandState {
  /** How much the canvas has expanded (1 = default, 1.5 = 50% larger) */
  canvasScale: number;
  /** Content within the viewport should scale inversely */
  contentScale: number;
  /** Padding that increases as viewport expands */
  padding: number;
  /** CSS transform for the expansion container */
  transform: string;
}

// ---- Animation Functions ----

/**
 * Gradual zoom out for the constellation sequence.
 * Camera slowly pulls back to reveal the full constellation pattern
 * forming from individual amber dots, then resolving into the TARA logo.
 *
 * Smooth, meditative pace — 76→72 BPM energy descent.
 */
export function slowPullBack(
  frame: number,
  config: {
    startFrame?: number;
    duration?: number;
    /** Starting zoom (closer in) */
    startZoom?: number;
    /** Ending zoom (pulled back) */
    endZoom?: number;
    /** Focus center X (0-1920) */
    centerX?: number;
    /** Focus center Y (0-1080) */
    centerY?: number;
  } = {}
): CameraState {
  const start = config.startFrame ?? sceneTiming.constellation.start;
  const duration = config.duration ?? sceneTiming.constellation.duration + sceneTiming.tagline.duration;
  const startZoom = config.startZoom ?? 1.15;
  const endZoom = config.endZoom ?? 0.85;
  const cx = config.centerX ?? width / 2;
  const cy = config.centerY ?? height / 2;
  const localFrame = frame - start;

  if (localFrame < 0) {
    const tx = (cx - width / 2) * (startZoom - 1);
    const ty = (cy - height / 2) * (startZoom - 1);
    return {
      zoom: startZoom,
      translateX: -tx,
      translateY: -ty,
      transform: `scale(${startZoom}) translate(${-tx / startZoom}px, ${-ty / startZoom}px)`,
    };
  }

  // Logarithmic easing — fast at start (revealing), slow at end (settling)
  // Achieved via combination of spring physics and interpolation
  const springVal = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 200,       // Very high damping = no oscillation
      stiffness: 8,       // Very low stiffness = slow movement
      mass: 3,            // High mass = momentum/inertia feel
    },
  });

  const zoom = interpolate(springVal, [0, 1], [startZoom, endZoom]);

  // Translate to keep focus center stable during zoom
  const tx = (cx - width / 2) * (zoom - 1);
  const ty = (cy - height / 2) * (zoom - 1);

  return {
    zoom,
    translateX: -tx,
    translateY: -ty,
    transform: `scale(${zoom}) translate(${-tx / zoom}px, ${-ty / zoom}px)`,
  };
}

/**
 * Attention shifting between elements.
 * Simulates a cinematographic focus pull — darkening periphery and
 * subtly adjusting position to guide the viewer's eye.
 *
 * Used during collaboration scene (PM → Engineer → Designer highlight).
 */
export function focusShift(
  frame: number,
  config: {
    /** Array of focus targets with timing */
    targets: Array<{
      frame: number;
      x: number;     // 0-1 normalized
      y: number;     // 0-1 normalized
      intensity?: number;
    }>;
    /** Transition duration between focus targets */
    transitionDuration?: number;
  }
): FocusShiftState {
  const { targets } = config;
  const transDur = config.transitionDuration ?? s(0.8);

  if (!targets.length) {
    return {
      focusX: 0.5,
      focusY: 0.5,
      vignetteIntensity: 0,
      defocusBlur: 0,
      vignetteGradient: "radial-gradient(circle at 50% 50%, transparent 40%, transparent 100%)",
    };
  }

  // Find current and next targets
  let currentIdx = 0;
  for (let i = targets.length - 1; i >= 0; i--) {
    if (frame >= targets[i].frame) {
      currentIdx = i;
      break;
    }
  }

  const current = targets[currentIdx];
  const next = currentIdx < targets.length - 1 ? targets[currentIdx + 1] : null;

  let focusX = current.x;
  let focusY = current.y;
  let vignetteIntensity = current.intensity ?? 0.4;

  // Smooth transition to next target
  if (next) {
    const transitionProgress = interpolate(
      frame,
      [current.frame, current.frame + transDur],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smoothEase }
    );

    // Only interpolate when we're approaching the next target's frame
    if (frame >= next.frame - transDur) {
      const approachProgress = interpolate(
        frame,
        [next.frame - transDur, next.frame],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smoothEase }
      );

      focusX = current.x + (next.x - current.x) * approachProgress;
      focusY = current.y + (next.y - current.y) * approachProgress;
      vignetteIntensity = (current.intensity ?? 0.4) +
        ((next.intensity ?? 0.4) - (current.intensity ?? 0.4)) * approachProgress;
    }
  }

  // Defocus blur: inverse of vignette — strong vignette = strong blur outside focus
  const defocusBlur = vignetteIntensity * 3;

  // CSS radial gradient for vignette overlay
  const pctX = (focusX * 100).toFixed(1);
  const pctY = (focusY * 100).toFixed(1);
  const innerRadius = 30 + (1 - vignetteIntensity) * 20;
  const vignetteGradient =
    `radial-gradient(ellipse at ${pctX}% ${pctY}%, ` +
    `transparent ${innerRadius}%, rgba(15, 23, 42, ${vignetteIntensity * 0.7}) 100%)`;

  return { focusX, focusY, vignetteIntensity, defocusBlur, vignetteGradient };
}

/**
 * Canvas expanding as visual complexity grows.
 * The viewport "breathes outward" as more information enters the scene.
 * Used during T5 (thread → collaboration → execution) and T6 (ecosystem).
 *
 * Simulates the sense of space growing to accommodate complexity.
 */
export function viewportExpand(
  frame: number,
  config: {
    startFrame?: number;
    duration?: number;
    /** Minimum canvas scale */
    minScale?: number;
    /** Maximum canvas scale */
    maxScale?: number;
    /** Expansion stages — each adds to the scale */
    stages?: Array<{
      frame: number;
      scaleAdd: number;
    }>;
  } = {}
): ViewportExpandState {
  const start = config.startFrame ?? sceneTiming.slackThread.start;
  const duration = config.duration ?? s(50); // spans thread through ecosystem
  const minScale = config.minScale ?? 1;
  const maxScale = config.maxScale ?? 1.25;
  const stages = config.stages ?? [
    { frame: sceneTiming.slackThread.start, scaleAdd: 0 },
    { frame: sceneTiming.collaboration.start, scaleAdd: 0.05 },
    { frame: sceneTiming.execution.start, scaleAdd: 0.08 },
    { frame: sceneTiming.ecosystem.start, scaleAdd: 0.12 },
  ];

  const localFrame = frame - start;

  if (localFrame < 0) {
    return {
      canvasScale: minScale,
      contentScale: 1 / minScale,
      padding: 0,
      transform: `scale(${minScale})`,
    };
  }

  // Accumulate scale from stages
  let targetScale = minScale;
  for (const stage of stages) {
    if (frame >= stage.frame) {
      targetScale = minScale + stage.scaleAdd;
    }
  }
  targetScale = Math.min(targetScale, maxScale);

  // Smooth spring transition between stages
  // Use a continuous interpolation rather than discrete springs
  const canvasScale = interpolate(
    localFrame,
    [0, duration],
    [minScale, targetScale],
    { extrapolateRight: "clamp", easing: smoothEase }
  );

  // Better: use spring for each stage transition
  // For now, spring toward the current target
  const springScale = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 50,
      stiffness: 20,
      mass: 2,
    },
  });

  const smoothScale = minScale + (targetScale - minScale) * springScale;
  const finalScale = Math.min(maxScale, Math.max(minScale, smoothScale));

  // Content scales inversely to keep text readable
  const contentScale = 1 / finalScale;

  // Padding increases with expansion
  const padding = (finalScale - 1) * 100;

  return {
    canvasScale: finalScale,
    contentScale,
    padding,
    transform: `scale(${finalScale.toFixed(4)})`,
  };
}

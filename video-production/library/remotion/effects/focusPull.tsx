/**
 * @effect FocusPull
 * @origin v5 — extracted 2026-03-23
 * @description Focus-pull (dolly zoom) effect that scales up a target region
 *   while blurring surrounding elements and adding a darkening vignette.
 *   Creates a cinematic "isolation" moment — used in v5 CollabScene to
 *   highlight human-judgment messages while dimming Tara's responses.
 *
 *   Parameters: target scales to 1.05, non-targets blur to 3px, and a
 *   radial vignette darkens edges.
 *
 * Usage:
 *   const focus = useFocusPull(frame, 360, 540);
 *   <div style={{ transform: `scale(${focus.contentScale})` }}>
 *     <div style={{ filter: focus.backgroundFilter }}>...blurred bg...</div>
 *     <div style={{ opacity: focus.targetOpacity }}>...focused content...</div>
 *   </div>
 *   <FocusPullVignette startFrame={360} endFrame={540} />
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

// ── Configuration ─────────────────────────────────────────────────────────────

export interface FocusPullConfig {
  /** Scale factor at peak focus (applied to the target group).  Default: 1.05 */
  targetScale?: number;
  /** Background blur radius in pixels at peak.  Default: 3 */
  backgroundBlur?: number;
  /** Dim factor for non-target elements at peak (0 = invisible, 1 = full).  Default: 0.5 */
  nonTargetDim?: number;
  /** Frames to ramp up from normal to focused state.  Default: 40 */
  rampInFrames?: number;
  /** Frames to ramp down from focused state to normal.  Default: 40 */
  rampOutFrames?: number;
  /** Transform origin for the scale (CSS format).  Default: '40% 50%' */
  transformOrigin?: string;
}

// ── Hook: useFocusPull ────────────────────────────────────────────────────────

export interface FocusPullValues {
  /** Scale to apply to the focused content group. 1.0 when inactive. */
  contentScale: number;
  /** Background blur CSS filter string.  'none' when inactive. */
  backgroundFilter: string;
  /** Background blur numeric value. */
  backgroundBlurPx: number;
  /** Opacity multiplier for non-target / non-focused elements. 1.0 when inactive. */
  nonTargetOpacity: number;
  /** Glow intensity for target-highlight overlays [0, 1]. */
  glowIntensity: number;
  /** Whether the focus-pull is currently active (within start..end window). */
  active: boolean;
}

/**
 * Hook: compute all focus-pull animation values for the current frame.
 *
 * @param frame        Current scene-relative frame.
 * @param startFrame   Frame at which the focus-pull begins.
 * @param endFrame     Frame at which the focus-pull ends (returns to normal).
 * @param config       Optional configuration overrides.
 */
export function useFocusPull(
  frame: number,
  startFrame: number,
  endFrame: number,
  config: FocusPullConfig = {},
): FocusPullValues {
  const {
    targetScale = 1.05,
    backgroundBlur = 3,
    nonTargetDim = 0.5,
    rampInFrames = 40,
    rampOutFrames = 40,
  } = config;

  const rampInEnd = startFrame + rampInFrames;
  const rampOutStart = endFrame - rampOutFrames;

  // Core intensity envelope: 0 → 1 → 1 → 0
  const intensity = interpolate(
    frame,
    [startFrame, rampInEnd, rampOutStart, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const active = intensity > 0.001;

  const contentScale = interpolate(
    frame,
    [startFrame, rampInEnd, rampOutStart, endFrame],
    [1, targetScale, targetScale, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const backgroundBlurPx = interpolate(
    frame,
    [startFrame, startFrame + 30, rampOutStart, endFrame],
    [0, backgroundBlur, backgroundBlur, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const nonTargetOpacity = interpolate(
    frame,
    [startFrame, startFrame + 30, rampOutStart, endFrame],
    [1, nonTargetDim, nonTargetDim, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return {
    contentScale,
    backgroundFilter: backgroundBlurPx > 0.5 ? `blur(${backgroundBlurPx}px)` : 'none',
    backgroundBlurPx,
    nonTargetOpacity,
    glowIntensity: intensity,
    active,
  };
}

// ── Component: FocusPullVignette ──────────────────────────────────────────────

export interface FocusPullVignetteProps {
  /** Frame at which the vignette begins darkening. */
  startFrame: number;
  /** Frame at which the vignette fully clears. */
  endFrame: number;
  /** Ramp duration in frames.  Default: 30 */
  rampFrames?: number;
  /** Peak vignette opacity.  Default: 0.4 */
  peakOpacity?: number;
  /** Center of the clear region (CSS format).  Default: '40% 50%' */
  center?: string;
  /** Size of the clear ellipse (CSS percentage).  Default: '70% 65%' */
  clearSize?: string;
}

/**
 * Darkening vignette overlay that isolates a focal region.
 * Renders as a radial gradient from transparent center to dark edges.
 */
export const FocusPullVignette: React.FC<FocusPullVignetteProps> = ({
  startFrame,
  endFrame,
  rampFrames = 30,
  peakOpacity = 0.4,
  center = '40% 50%',
  clearSize = '70% 65%',
}) => {
  const frame = useCurrentFrame();

  const intensity = interpolate(
    frame,
    [startFrame, startFrame + rampFrames, endFrame - rampFrames, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (intensity < 0.01) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse ${clearSize} at ${center}, transparent 40%, rgba(15, 23, 42, ${peakOpacity * intensity}))`,
        pointerEvents: 'none',
        opacity: intensity,
      }}
    />
  );
};

// ── Component: FocusPullGlow ──────────────────────────────────────────────────

export interface FocusPullGlowProps {
  /** Frame at which the glow begins. */
  startFrame: number;
  /** Frame at which the glow ends. */
  endFrame: number;
  /** Ramp duration in frames.  Default: 40 */
  rampFrames?: number;
  /** Peak glow opacity.  Default: 0.02 */
  peakOpacity?: number;
  /** Center of the glow region (CSS format).  Default: '35% 50%' */
  center?: string;
  /** Size of the glow ellipse (CSS percentage).  Default: '50% 60%' */
  glowSize?: string;
}

/**
 * Subtle white glow overlay behind the focused content.
 * Adds warmth and visual separation from the darkened background.
 */
export const FocusPullGlow: React.FC<FocusPullGlowProps> = ({
  startFrame,
  endFrame,
  rampFrames = 40,
  peakOpacity = 0.02,
  center = '35% 50%',
  glowSize = '50% 60%',
}) => {
  const frame = useCurrentFrame();

  const intensity = interpolate(
    frame,
    [startFrame, startFrame + rampFrames, endFrame - rampFrames, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (intensity < 0.01) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse ${glowSize} at ${center}, rgba(255, 255, 255, ${peakOpacity * intensity}), transparent)`,
        pointerEvents: 'none',
      }}
    />
  );
};

// ── Composite component ───────────────────────────────────────────────────────

export interface FocusPullOverlayProps {
  startFrame: number;
  endFrame: number;
  config?: FocusPullConfig;
  showVignette?: boolean;
  showGlow?: boolean;
}

/**
 * Composite overlay that renders both vignette and glow layers.
 * Place this as a sibling of the content being focused.
 */
export const FocusPullOverlay: React.FC<FocusPullOverlayProps> = ({
  startFrame,
  endFrame,
  showVignette = true,
  showGlow = true,
}) => {
  return (
    <>
      {showGlow && (
        <FocusPullGlow startFrame={startFrame} endFrame={endFrame} />
      )}
      {showVignette && (
        <FocusPullVignette startFrame={startFrame} endFrame={endFrame} />
      )}
    </>
  );
};

export default FocusPullOverlay;

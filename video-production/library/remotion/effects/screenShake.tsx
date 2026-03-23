/**
 * @effect ScreenShake
 * @origin v2 — extracted 2026-03-23
 * @description Screen shake effect with two variants:
 *   1. Micro-jolt: A precise 2-frame, 2px displacement for clean punctuation marks
 *      (from v2 DiscussionScene, iteration 43).
 *   2. Aftershock ripple rings: Three staggered SVG circles expanding outward at
 *      650/480/350px with decreasing opacity (from v2 DiscussionScene split moment).
 *
 *   Also exports a longer sine-based shake (from v5 ExecutionScene) for heavier impacts.
 *
 * Usage:
 *   const { x, y } = useMicroJolt(frame, splitFrame);
 *   <div style={{ transform: `translate(${x}px, ${y}px)` }}>
 *     ...content...
 *   </div>
 *
 *   <AftershockRipples triggerFrame={splitFrame} cx={960} cy={460} />
 */

import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Micro-Jolt (v2 style — 2px, 2 frames, clean and decisive)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 2-frame micro-jolt displacement table.
 * Frame 0 after trigger: (2, -2), Frame 1: (-1, 1), then zero.
 */
const JOLT_TABLE_X = [2, -1];
const JOLT_TABLE_Y = [-2, 1];

/**
 * Hook: compute micro-jolt displacement for a given frame.
 * Returns {x, y} in pixels — apply via CSS translate.
 */
export function useMicroJolt(
  frame: number,
  triggerFrame: number,
): { x: number; y: number } {
  const age = frame - triggerFrame;
  if (age < 0 || age >= JOLT_TABLE_X.length) return { x: 0, y: 0 };
  return {
    x: JOLT_TABLE_X[age] ?? 0,
    y: JOLT_TABLE_Y[age] ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Sine-based screen shake (v5 style — 12px amplitude, 18-frame decay)
// ═══════════════════════════════════════════════════════════════════════════════

export interface SineShakeOptions {
  /** Maximum amplitude in pixels.  Default: 12 */
  amplitude?: number;
  /** Total shake duration in frames.  Default: 18 */
  durationFrames?: number;
  /** Horizontal frequency multiplier.  Default: 7.3 */
  freqX?: number;
  /** Vertical frequency multiplier.  Default: 5.7 */
  freqY?: number;
}

/**
 * Hook: compute sine-based screen shake displacement.
 * Decays linearly from full amplitude to zero over durationFrames.
 */
export function useSineShake(
  frame: number,
  triggerFrame: number,
  options: SineShakeOptions = {},
): { x: number; y: number } {
  const {
    amplitude = 12,
    durationFrames = 18,
    freqX = 7.3,
    freqY = 5.7,
  } = options;

  const age = frame - triggerFrame;
  if (age < 0 || age > durationFrames) return { x: 0, y: 0 };

  const decay = interpolate(age, [0, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    x: Math.sin(age * freqX) * amplitude * decay,
    y: Math.cos(age * freqY) * amplitude * decay,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Aftershock Ripple Rings (v2 DiscussionScene — 650/480/350px rings)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RippleRingConfig {
  /** Delay in frames after trigger before this ring starts.  */
  delay: number;
  /** Maximum radius in pixels. */
  maxRadius: number;
  /** Duration of expansion in frames. */
  expandDuration: number;
  /** SVG stroke width. */
  strokeWidth: number;
  /** Peak opacity at the start of expansion. */
  peakOpacity: number;
}

/** Default three-ring aftershock configuration from v2 DiscussionScene. */
export const DEFAULT_RIPPLE_RINGS: RippleRingConfig[] = [
  { delay: 3, maxRadius: 650, expandDuration: 35, strokeWidth: 4, peakOpacity: 0.9 },
  { delay: 8, maxRadius: 480, expandDuration: 40, strokeWidth: 2.5, peakOpacity: 0.5 },
  { delay: 15, maxRadius: 350, expandDuration: 50, strokeWidth: 1.5, peakOpacity: 0.25 },
];

export interface AftershockRipplesProps {
  /** Frame at which the ripple event occurs (scene-relative). */
  triggerFrame: number;
  /** X center of the ripple origin. */
  cx: number;
  /** Y center of the ripple origin. */
  cy: number;
  /** Ring configurations.  Default: DEFAULT_RIPPLE_RINGS */
  rings?: RippleRingConfig[];
  /** Stroke color for all rings.  Default: '#d97706' (amber) */
  color?: string;
  /** SVG viewBox width.  Default: 1920 */
  width?: number;
  /** SVG viewBox height.  Default: 1080 */
  height?: number;
}

/**
 * Renders expanding aftershock ripple rings as an SVG overlay.
 * Each ring starts at a staggered delay and expands outward with fading opacity.
 */
export const AftershockRipples: React.FC<AftershockRipplesProps> = ({
  triggerFrame,
  cx,
  cy,
  rings = DEFAULT_RIPPLE_RINGS,
  color = '#d97706',
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const age = frame - triggerFrame;

  // Early-out: nothing to render before trigger or after all rings finish
  const maxDuration = Math.max(...rings.map((r) => r.delay + r.expandDuration));
  if (age < 0 || age > maxDuration) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {rings.map((ring, i) => {
        const ringAge = age - ring.delay;
        if (ringAge < 0) return null;

        const radius = interpolate(ringAge, [0, ring.expandDuration], [8, ring.maxRadius], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(
          ringAge,
          [0, 2, ring.expandDuration],
          [0, ring.peakOpacity, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        if (opacity <= 0.01) return null;

        return (
          <circle
            key={`ripple-${i}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={ring.strokeWidth}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Combined ScreenShake wrapper component
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScreenShakeProps {
  /** Frame at which the shake triggers (scene-relative). */
  triggerFrame: number;
  /** Shake variant.  Default: 'micro' */
  variant?: 'micro' | 'sine';
  /** Options for sine variant. */
  sineOptions?: SineShakeOptions;
  /** Content to shake. */
  children: React.ReactNode;
}

/**
 * Wrapper component that applies screen-shake transform to its children.
 */
export const ScreenShake: React.FC<ScreenShakeProps> = ({
  triggerFrame,
  variant = 'micro',
  sineOptions,
  children,
}) => {
  const frame = useCurrentFrame();

  const displacement =
    variant === 'micro'
      ? useMicroJolt(frame, triggerFrame)
      : useSineShake(frame, triggerFrame, sineOptions);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${displacement.x}px, ${displacement.y}px)`,
      }}
    >
      {children}
    </div>
  );
};

export default ScreenShake;

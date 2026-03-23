/**
 * @effect AnamorphicFlare
 * @origin v2 — extracted 2026-03-23
 * @description Horizontal anamorphic lens flare overlay. A thin amber/white
 *   gradient streak that expands across the frame, simulating a cinematic
 *   anamorphic lens flare pulse.  Uses mix-blend-mode: overlay for
 *   natural compositing.  Designed for logo reveals and finale flourishes.
 *
 * Usage:
 *   <AnamorphicFlare triggerFrame={230} />
 *   <AnamorphicFlare triggerFrame={270} variant="sweep" sweepRange={[-20, 120]} />
 */

import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

// ── Shared math ───────────────────────────────────────────────────────────────

/**
 * Compute flare opacity and width for a given frame.
 * Returns { opacity, width } — both 0 when outside the active window.
 */
export function computeFlare(
  frame: number,
  triggerFrame: number,
  durationFrames: number = 40,
  peakOpacity: number = 0.6,
  widthKeyframes: [number, number, number] = [200, 1200, 1600],
): { opacity: number; width: number } {
  const age = frame - triggerFrame;
  if (age < 0 || age >= durationFrames) return { opacity: 0, width: 0 };

  const opacity = interpolate(
    age,
    [0, 5, 15, durationFrames],
    [0, peakOpacity, peakOpacity * 0.5, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const width = interpolate(
    age,
    [0, 8, durationFrames],
    widthKeyframes,
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return { opacity, width };
}

// ── Pulse variant ─────────────────────────────────────────────────────────────

export interface AnamorphicFlarePulseProps {
  /** Frame at which the flare fires (scene-relative). */
  triggerFrame: number;
  /** Total duration in frames.  Default: 40 */
  durationFrames?: number;
  /** Peak opacity of the flare core.  Default: 0.6 */
  peakOpacity?: number;
  /** [start, mid, end] widths in pixels.  Default: [200, 1200, 1600] */
  widthKeyframes?: [number, number, number];
  /** Height of the flare streak in pixels.  Default: 4 */
  height?: number;
  /** Blur radius in pixels.  Default: 2 */
  blur?: number;
  /** Warm color at gradient edges.  Default: 'rgba(255, 178, 92, 0.1)' */
  warmColor?: string;
  /** Core color at center.  Default: white at flare opacity */
  coreColor?: string;
}

/**
 * Pulse flare — a thin horizontal streak that expands from the center.
 * This is the original v2 VisionScene anamorphic flare.
 */
export const AnamorphicFlarePulse: React.FC<AnamorphicFlarePulseProps> = ({
  triggerFrame,
  durationFrames = 40,
  peakOpacity = 0.6,
  widthKeyframes = [200, 1200, 1600],
  height = 4,
  blur = 2,
  warmColor = 'rgba(255, 178, 92, 0.1)',
  coreColor,
}) => {
  const frame = useCurrentFrame();
  const { opacity, width } = computeFlare(frame, triggerFrame, durationFrames, peakOpacity, widthKeyframes);

  if (opacity <= 0) return null;

  const core = coreColor ?? `rgba(255, 255, 255, ${opacity * 0.8})`;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width,
        height,
        transform: 'translate(-50%, -50%)',
        background: `linear-gradient(90deg, transparent 0%, ${warmColor} 15%, rgba(255, 220, 160, ${opacity}) 45%, ${core} 50%, rgba(255, 220, 160, ${opacity}) 55%, ${warmColor} 85%, transparent 100%)`,
        pointerEvents: 'none',
        filter: `blur(${blur}px)`,
      }}
    />
  );
};

// ── Sweep variant ─────────────────────────────────────────────────────────────

export interface AnamorphicFlareSweepProps {
  /** Frame at which the sweep begins (scene-relative). */
  triggerFrame: number;
  /** Duration of the sweep in frames.  Default: 60 */
  durationFrames?: number;
  /** [startPercent, endPercent] of the sweep across the container.  Default: [-20, 120] */
  sweepRange?: [number, number];
  /** Peak opacity.  Default: 0.4 */
  peakOpacity?: number;
  /** Width of the bright band in percentage points.  Default: 10 */
  bandWidth?: number;
  /** CSS mix-blend-mode.  Default: 'overlay' */
  blendMode?: React.CSSProperties['mixBlendMode'];
}

/**
 * Sweep flare — a bright band that sweeps horizontally across the element.
 * Used for shimmer/light-sweep effects over text or logos.
 */
export const AnamorphicFlareSweep: React.FC<AnamorphicFlareSweepProps> = ({
  triggerFrame,
  durationFrames = 60,
  sweepRange = [-20, 120],
  peakOpacity = 0.4,
  bandWidth = 10,
  blendMode = 'overlay',
}) => {
  const frame = useCurrentFrame();
  const age = frame - triggerFrame;

  if (age < 0 || age >= durationFrames) return null;

  const sweepX = interpolate(age, [0, durationFrames], sweepRange, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(
    age,
    [0, durationFrames * 0.15, durationFrames * 0.5, durationFrames],
    [0, peakOpacity, peakOpacity * 0.75, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const halfBand = bandWidth / 2;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, transparent 0%, transparent ${sweepX - halfBand * 1.5}%, rgba(255, 220, 160, ${opacity * 0.5}) ${sweepX - halfBand / 2}%, rgba(255, 255, 255, ${opacity}) ${sweepX}%, rgba(255, 220, 160, ${opacity * 0.5}) ${sweepX + halfBand / 2}%, transparent ${sweepX + halfBand * 1.5}%, transparent 100%)`,
        pointerEvents: 'none',
        mixBlendMode: blendMode,
      }}
    />
  );
};

// ── Convenience wrapper ───────────────────────────────────────────────────────

export interface AnamorphicFlareProps {
  /** 'pulse' for expanding streak, 'sweep' for horizontal wipe. */
  variant?: 'pulse' | 'sweep';
  triggerFrame: number;
  durationFrames?: number;
  peakOpacity?: number;
}

/**
 * Convenience component that selects between pulse and sweep variants.
 */
export const AnamorphicFlare: React.FC<
  AnamorphicFlareProps & Partial<AnamorphicFlarePulseProps> & Partial<AnamorphicFlareSweepProps>
> = ({ variant = 'pulse', ...props }) => {
  if (variant === 'sweep') {
    return <AnamorphicFlareSweep {...(props as AnamorphicFlareSweepProps)} />;
  }
  return <AnamorphicFlarePulse {...(props as AnamorphicFlarePulseProps)} />;
};

export default AnamorphicFlare;

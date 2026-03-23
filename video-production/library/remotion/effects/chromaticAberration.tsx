/**
 * @effect ChromaticAberration
 * @origin v5 — extracted 2026-03-23
 * @description Chromatic aberration pulse overlay using CSS mix-blend-mode: screen
 *   with red and blue offset copies.  Designed to fire at impact moments
 *   (fork splits, collisions) for a brief 10-15 frame burst.
 *
 * Usage:
 *   <ChromaticAberration
 *     triggerFrame={60}       // absolute frame to fire
 *     peakOffset={4}          // max pixel shift at peak
 *     durationFrames={15}     // how long the effect lasts
 *     rampFrames={3}          // frames to reach peak
 *   />
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export interface ChromaticAberrationProps {
  /** Frame at which the aberration begins (scene-relative). */
  triggerFrame: number;
  /** Maximum pixel offset at peak intensity.  Default: 4 */
  peakOffset?: number;
  /** Total duration of the aberration burst in frames.  Default: 15 */
  durationFrames?: number;
  /** Frames from trigger to reach peak intensity.  Default: 3 */
  rampFrames?: number;
  /** Base opacity multiplier for each color channel.  Default: 0.06 */
  channelOpacity?: number;
  /** Center position of the radial gradient (CSS format).  Default: '50% 25%' */
  center?: string;
  /** Radius of the color spill gradient (CSS percentage).  Default: 60 */
  gradientRadius?: number;
  /** Blue channel color.  Default: 'rgba(59, 130, 246, 0.3)' */
  blueColor?: string;
  /** Red channel color.  Default: 'rgba(239, 68, 68, 0.3)' */
  redColor?: string;
  /** Optional green channel color.  When provided, a third layer is added. */
  greenColor?: string;
  /** Minimum intensity threshold before rendering (avoids sub-pixel layers). Default: 0.5 */
  threshold?: number;
  /** CSS z-index for the overlay layers.  Default: 50 */
  zIndex?: number;
}

/**
 * Compute the chromatic aberration intensity for a given frame.
 * Returns 0 when outside the active window.
 */
export function chromaticIntensity(
  frame: number,
  triggerFrame: number,
  peakOffset: number = 4,
  durationFrames: number = 15,
  rampFrames: number = 3,
): number {
  const age = frame - triggerFrame;
  if (age < 0 || age >= durationFrames) return 0;
  return interpolate(
    age,
    [0, rampFrames, durationFrames],
    [0, peakOffset, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
}

export const ChromaticAberration: React.FC<ChromaticAberrationProps> = ({
  triggerFrame,
  peakOffset = 4,
  durationFrames = 15,
  rampFrames = 3,
  channelOpacity = 0.06,
  center = '50% 25%',
  gradientRadius = 60,
  blueColor = 'rgba(59, 130, 246, 0.3)',
  redColor = 'rgba(239, 68, 68, 0.3)',
  greenColor,
  threshold = 0.5,
  zIndex = 50,
}) => {
  const frame = useCurrentFrame();
  const intensity = chromaticIntensity(frame, triggerFrame, peakOffset, durationFrames, rampFrames);

  if (intensity < threshold) return null;

  const layerStyle = (
    color: string,
    translateX: number,
  ): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    transform: `translate(${translateX}px, 0)`,
    mixBlendMode: 'screen',
    opacity: intensity * channelOpacity,
    background: `radial-gradient(circle at ${center}, ${color}, transparent ${gradientRadius}%)`,
    pointerEvents: 'none',
    zIndex,
  });

  return (
    <>
      {/* Blue channel — shifted right */}
      <div style={layerStyle(blueColor, intensity)} />

      {/* Red channel — shifted left */}
      <div style={layerStyle(redColor, -intensity)} />

      {/* Optional green channel — no shift, pure screen blend */}
      {greenColor && (
        <div style={layerStyle(greenColor, 0)} />
      )}
    </>
  );
};

export default ChromaticAberration;

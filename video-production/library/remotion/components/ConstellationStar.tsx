/** @component ConstellationStar @origin v5 — extracted to library 2026-03-23 @description Two-layer convergence star with spring entrance, twinkle/shimmer animation, and radial glow */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS } from '../theme';

interface ConstellationStarProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  brightness: number;
}

export const ConstellationStar: React.FC<ConstellationStarProps> = ({
  x,
  y,
  size,
  delay,
  brightness,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < delay) return null;

  const entranceSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 6, stiffness: 130, mass: 0.7 },
  });
  const entranceScale = interpolate(entranceSpring, [0, 1], [0, 1]);

  const fadeIn = interpolate(entranceSpring, [0, 0.4, 1], [0, brightness, brightness], {
    extrapolateRight: 'clamp',
  });

  const twinklePhase = x * 0.017 + y * 0.013;
  const twinkle = interpolate(Math.sin((frame - delay) * 0.1 + twinklePhase), [-1, 1], [0.4, 1]);
  const shimmer = interpolate(Math.sin((frame - delay) * 0.04 + twinklePhase * 2.3), [-1, 1], [0.75, 1]);
  const currentBrightness = fadeIn * twinkle * shimmer;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.accent.amberLight} 0%, ${COLORS.accent.amber}80 40%, transparent 70%)`,
        opacity: currentBrightness,
        boxShadow: `0 0 ${size * 3 * twinkle}px ${COLORS.accent.amber}${Math.round(currentBrightness * 80).toString(16).padStart(2, '0')}`,
        transform: `translate(-50%, -50%) scale(${entranceScale * (0.95 + 0.05 * twinkle)})`,
        pointerEvents: 'none',
      }}
    />
  );
};

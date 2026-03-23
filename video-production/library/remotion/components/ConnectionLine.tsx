/** @component ConnectionLine @origin v2 — extracted to library 2026-03-23 @description Animated SVG connection line with glow+main dual-layer rendering, quadratic bezier curve, and stroke-dashoffset draw animation */
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../theme';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay: number;
  color?: string;
  durationFrames?: number;
  strokeWidth?: number;
  dashed?: boolean;
  opacity?: number;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  delay,
  color = COLORS.accent.amber,
  durationFrames = 15,
  strokeWidth = 2,
  dashed = false,
  opacity: opacityOverride,
}) => {
  const frame = useCurrentFrame();

  if (frame < delay) return null;

  // Calculate line length
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Animate stroke-dashoffset from full length to 0
  const drawProgress = interpolate(
    frame,
    [delay, delay + durationFrames],
    [length, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const baseOpacity = interpolate(
    frame,
    [delay, delay + 5],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const opacity = opacityOverride !== undefined
    ? baseOpacity * opacityOverride
    : baseOpacity;

  // Create a slight curve via quadratic bezier
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  // Offset the midpoint perpendicular to the line
  const perpX = -dy * 0.1;
  const perpY = dx * 0.1;
  const ctrlX = midX + perpX;
  const ctrlY = midY + perpY;

  const pathD = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <path
        d={pathD}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={dashed ? '6 4' : `${length}`}
        strokeDashoffset={dashed ? 0 : drawProgress}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 6px ${color}40)`,
        }}
      />
    </svg>
  );
};

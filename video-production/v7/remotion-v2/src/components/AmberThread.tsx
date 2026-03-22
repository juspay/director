import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { theme, WIDTH, HEIGHT } from '../theme';

interface AmberThreadProps {
  /** Direction: 'left-to-right' | 'right-to-left' | 'converge-center' */
  direction?: 'left-to-right' | 'right-to-left' | 'converge-center';
  /** Total frames to draw */
  drawDuration?: number;
}

export const AmberThread: React.FC<AmberThreadProps> = ({
  direction = 'left-to-right',
  drawDuration = 20,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, drawDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pathLength = WIDTH + 200; // slightly longer than screen
  const dashOffset = pathLength * (1 - progress);

  if (direction === 'converge-center') {
    // Two threads from edges to center
    return (
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <line
          x1={0}
          y1={HEIGHT / 2}
          x2={WIDTH / 2}
          y2={HEIGHT / 2}
          stroke={theme.amber.primary}
          strokeWidth={2}
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          opacity={0.8}
        />
        <line
          x1={WIDTH}
          y1={HEIGHT / 2}
          x2={WIDTH / 2}
          y2={HEIGHT / 2}
          stroke={theme.amber.primary}
          strokeWidth={2}
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          opacity={0.8}
        />
      </svg>
    );
  }

  const x1 = direction === 'left-to-right' ? -100 : WIDTH + 100;
  const x2 = direction === 'left-to-right' ? WIDTH + 100 : -100;

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <line
        x1={x1}
        y1={HEIGHT / 2}
        x2={x2}
        y2={HEIGHT / 2}
        stroke={theme.amber.primary}
        strokeWidth={2}
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        opacity={0.8}
      />
    </svg>
  );
};

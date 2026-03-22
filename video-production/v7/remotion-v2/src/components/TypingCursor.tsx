import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { theme } from '../theme';

interface TypingCursorProps {
  x: number;
  y: number;
  size?: number;
  /** Keyframe path: array of [frame, x, y] tuples for position animation */
  path?: [number, number, number][];
}

export const TypingCursor: React.FC<TypingCursorProps> = ({
  x,
  y,
  size = 20,
  path,
}) => {
  const frame = useCurrentFrame();

  // Blink: on for 15 frames, off for 15 frames
  const blinkCycle = frame % 30;
  const opacity = blinkCycle < 15 ? 0.9 : 0;

  // Animate position along path if provided
  let curX = x;
  let curY = y;
  if (path && path.length > 1) {
    const frames = path.map((p) => p[0]);
    const xs = path.map((p) => p[1]);
    const ys = path.map((p) => p[2]);
    curX = interpolate(frame, frames, xs, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    curY = interpolate(frame, frames, ys, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: curX,
        top: curY,
        width: 2,
        height: size,
        backgroundColor: theme.accent.green,
        opacity,
        borderRadius: 1,
      }}
    />
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MorphTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // Bright flash in the middle, fading on both ends
  const brightness = interpolate(
    frame,
    [0, 10, 14, 24],
    [0, 0.3, 0.3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scale pulse
  const scale = interpolate(
    frame,
    [0, 12, 24],
    [1.0, 1.05, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(217, 119, 6, ${brightness})`,
        backdropFilter: `blur(${brightness * 16}px)`,
        transform: `scale(${scale})`,
      }}
    />
  );
};

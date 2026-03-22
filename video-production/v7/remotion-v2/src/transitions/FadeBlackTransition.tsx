import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const FadeBlackTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // 24 frames total: 0-12 = fade to black, 12-24 = fade from black
  const opacity = frame <= 12
    ? interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [12, 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${opacity})` }} />
  );
};

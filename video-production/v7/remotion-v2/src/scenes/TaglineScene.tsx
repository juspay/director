import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { StarMotif } from '../components/StarMotif';
import { theme, springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Star: frames 0-30
  // (StarMotif handles its own spring animation)

  // "TARA": frames 20-50
  const taraProgress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.snappy,
  });

  // "Build what matters.": frames 40-70
  const taglineProgress = spring({
    frame: Math.max(0, frame - 40),
    fps: FPS,
    config: springs.gentle,
  });
  const taglineY = interpolate(taglineProgress, [0, 1], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.canvas.dark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Star logo */}
      <StarMotif x={WIDTH / 2} y={HEIGHT / 2 - 100} size={100} ringStagger={8} />

      {/* "TARA" */}
      <div
        style={{
          position: 'absolute',
          top: HEIGHT / 2 + 20,
          fontFamily: fonts.sans,
          fontWeight: 'bold',
          fontSize: 72,
          color: theme.text.primary,
          letterSpacing: 16,
          opacity: taraProgress,
          transform: `scale(${0.9 + taraProgress * 0.1})`,
        }}
      >
        TARA
      </div>

      {/* "Build what matters." */}
      <div
        style={{
          position: 'absolute',
          top: HEIGHT / 2 + 110,
          fontFamily: fonts.serif,
          fontSize: 32,
          color: theme.text.secondary,
          opacity: taglineProgress,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Build what matters.
      </div>
    </AbsoluteFill>
  );
};

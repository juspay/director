import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, spring, interpolate } from 'remotion';
import { TaraAvatar } from '../components/TaraAvatar';
import { StarMotif } from '../components/StarMotif';
import { springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

export const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text: frames 0-15, spring snappy
  const textProgress = spring({
    frame,
    fps: FPS,
    config: springs.snappy,
  });
  const textY = interpolate(textProgress, [0, 1], [10, 0]);

  return (
    <AbsoluteFill>
      {/* Veo 2 background */}
      <OffthreadVideo
        src={staticFile('veo2/06c_tara_reveal_v2.mp4')}
        style={{ width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
      />

      {/* Dark overlay for text legibility */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />

      {/* "Tara closes that gap." */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.serif,
          fontSize: 64,
          color: '#f1f5f9',
          opacity: textProgress,
          transform: `translateY(${textY}px)`,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        Tara closes that gap.
      </div>

      {/* StarMotif: fires at frame 10, compressed stagger (5 frames) */}
      <StarMotif x={WIDTH / 2 - 200} y={HEIGHT / 2 - 40} delay={10} ringStagger={5} />

      {/* Avatar: enters at frame 20, bottom-right */}
      <TaraAvatar delay={20} />
    </AbsoluteFill>
  );
};

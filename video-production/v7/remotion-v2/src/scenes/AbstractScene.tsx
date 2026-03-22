import React, { useState } from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from 'remotion';
import { TextOverlay } from '../components/TextOverlay';
import { TaraAvatar } from '../components/TaraAvatar';
import { fonts, FPS, WIDTH, HEIGHT } from '../theme';

interface AbstractSceneProps {
  clip: string;
  textOverlay?: string;
  showAvatar?: boolean;
}

// Veo 2 clips are ~8s. For scenes longer than this, slow playback to fill.
const VEO2_CLIP_DURATION_S = 8;

export const AbstractScene: React.FC<AbstractSceneProps> = ({
  clip,
  textOverlay,
  showAvatar = false,
}) => {
  const { durationInFrames } = useVideoConfig();
  const [error, setError] = useState(false);

  if (error || !clip) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: 'magenta',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 32,
          color: 'white',
        }}
      >
        MISSING: {clip || 'no clip specified'}
      </AbsoluteFill>
    );
  }

  // Slow playback for scenes longer than clip duration
  const sceneDurationS = durationInFrames / FPS;
  const playbackRate = sceneDurationS > VEO2_CLIP_DURATION_S
    ? VEO2_CLIP_DURATION_S / sceneDurationS
    : 1;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(`veo2/${clip}`)}
        playbackRate={playbackRate}
        style={{ width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
        onError={() => setError(true)}
      />
      {textOverlay && (
        <TextOverlay
          text={textOverlay}
          fontSize={40}
          fontFamily={fonts.sans}
          color="#f1f5f9"
          withBackground
          delay={15}
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        />
      )}
      {showAvatar && <TaraAvatar />}
    </AbsoluteFill>
  );
};

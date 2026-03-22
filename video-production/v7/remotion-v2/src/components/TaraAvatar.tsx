import React from 'react';
import { Img, useCurrentFrame, spring, staticFile } from 'remotion';
import { theme, springs, FPS } from '../theme';

interface TaraAvatarProps {
  size?: number;
  x?: number;
  y?: number;
  delay?: number; // frames before entrance
}

export const TaraAvatar: React.FC<TaraAvatarProps> = ({
  size = 160,
  x,
  y,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const scale = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.bouncy,
  });

  // Amber glow pulse: 2s cycle (60 frames), alpha 0.3 → 0.6
  const glowAlpha = 0.3 + 0.15 * (1 + Math.sin((frame / 60) * Math.PI * 2));

  const posX = x ?? 1920 - size - 20;
  const posY = y ?? 1080 - size - 20;

  return (
    <div
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${theme.amber.primary}`,
        overflow: 'hidden',
        transform: `scale(${scale})`,
        boxShadow: `0 0 20px rgba(217, 119, 6, ${glowAlpha})`,
      }}
    >
      <Img
        src={staticFile('avatar/tara_square_nobg.png')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};

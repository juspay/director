import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { springs, fonts, FPS } from '../theme';

interface TextOverlayProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  delay?: number; // frames before entrance
  withBackground?: boolean;
  style?: React.CSSProperties;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  fontSize = 36,
  fontFamily = fonts.sans,
  color = '#f1f5f9',
  delay = 0,
  withBackground = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.gentle,
  });

  const translateY = interpolate(progress, [0, 1], [20, 0]);
  const opacity = progress;

  return (
    <div
      style={{
        position: 'absolute',
        fontFamily,
        fontSize,
        color,
        transform: `translateY(${translateY}px)`,
        opacity,
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
        ...(withBackground
          ? {
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '8px 16px',
              borderRadius: 8,
            }
          : {}),
        ...style,
      }}
    >
      {text}
    </div>
  );
};

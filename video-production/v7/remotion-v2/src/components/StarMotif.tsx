import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, FPS } from '../theme';

interface StarMotifProps {
  x: number;
  y: number;
  size?: number;
  delay?: number;
  ringStagger?: number; // frames between each ring
}

export const StarMotif: React.FC<StarMotifProps> = ({
  x,
  y,
  size = 80,
  delay = 0,
  ringStagger = 8,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const starScale = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.bouncy,
  });

  const rings = [0, 1, 2].map((i) => {
    const ringFrame = Math.max(0, adjusted - i * ringStagger);
    const ringScale = spring({
      frame: ringFrame,
      fps: FPS,
      config: springs.gentle,
    });
    const ringOpacity = interpolate(ringScale, [0, 0.5, 1], [0, 0.4, 0.1]);
    const ringSize = size * (1.5 + i * 0.5) * ringScale;
    return { ringSize, ringOpacity, key: i };
  });

  // 5-pointed star path
  const starPath = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? size * 0.4 : size * 0.18;
    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      {/* Glow rings */}
      {rings.map(({ ringSize, ringOpacity, key }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: -ringSize / 2,
            top: -ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `1px solid ${theme.amber.primary}`,
            opacity: ringOpacity,
          }}
        />
      ))}
      {/* Star */}
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        style={{
          position: 'absolute',
          left: -size / 2,
          top: -size / 2,
          transform: `scale(${starScale})`,
        }}
      >
        <polygon
          points={starPath}
          fill={theme.amber.primary}
          stroke={theme.amber.light}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};

/** @component ResultBadge @origin v8 — extracted to library 2026-03-23 @description Badge with overshoot spring entrance + staggered delay, slide-in translateX, and scale bounce */
import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS, FONTS } from '../theme';
import { FPS } from '../timing';

interface ResultBadgeProps {
  icon: string;
  label: string;
  color?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const ResultBadge: React.FC<ResultBadgeProps> = ({
  icon,
  label,
  color = COLORS.amber,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const delayedFrame = Math.max(0, frame - delay);

  const entrance = spring({
    frame: delayedFrame,
    fps: FPS,
    config: { damping: 12, mass: 0.6, stiffness: 150 },
  });

  const translateX = interpolate(entrance, [0, 1], [40, 0]);
  const scale = interpolate(entrance, [0, 0.6, 1], [0.8, 1.05, 1], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(delayedFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 10px',
        backgroundColor: COLORS.slackMessage,
        borderRadius: 6,
        border: `1px solid ${COLORS.slackBorder}`,
        borderLeft: `3px solid ${color}`,
        fontFamily: FONTS.sans,
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        ...style,
      }}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.textPrimary,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
    </div>
  );
};

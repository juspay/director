/**
 * @component SlackThread
 * @origin v8 — extracted to library on 2026-03-23
 * @description Slack-style thread container with header bar (channel name, reply count),
 *   connecting thread line, and spring-animated slide-in entrance. Wraps SlackMessage
 *   children to form a complete thread UI.
 */
import React from 'react';
import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONTS } from '../theme';
import { FPS } from '../timing';

interface SlackThreadProps {
  channelName: string;
  replyCount?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SlackThread: React.FC<SlackThreadProps> = ({
  channelName,
  replyCount,
  children,
  style,
}) => {
  const frame = useCurrentFrame();

  const containerOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const slideY = spring({
    frame,
    fps: FPS,
    config: { damping: 20, mass: 0.8, stiffness: 80 },
  });

  const translateY = interpolate(slideY, [0, 1], [16, 0]);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: COLORS.slackBg,
        borderRadius: 8,
        border: `1px solid ${COLORS.slackBorder}`,
        overflow: 'hidden',
        fontFamily: FONTS.sans,
        opacity: containerOpacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {/* Thread header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: `1px solid ${COLORS.slackBorder}`,
          backgroundColor: COLORS.slackSidebar,
        }}
      >
        {/* Thread icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M4 6h8M4 10h5"
            stroke={COLORS.textMuted}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: '-0.01em',
          }}
        >
          Thread
        </span>

        <span
          style={{
            fontSize: 13,
            color: COLORS.slackLink,
            fontWeight: 500,
          }}
        >
          {channelName}
        </span>

        {replyCount !== undefined && (
          <span
            style={{
              fontSize: 12,
              color: COLORS.textMuted,
              marginLeft: 'auto',
            }}
          >
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {/* Thread body with left thread line */}
      <div
        style={{
          position: 'relative',
          padding: '8px 0',
        }}
      >
        {/* Thread connecting line */}
        <div
          style={{
            position: 'absolute',
            left: 34,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: COLORS.slackBorder,
            borderRadius: 1,
          }}
        />

        {children}
      </div>
    </div>
  );
};

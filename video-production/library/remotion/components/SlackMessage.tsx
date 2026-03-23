/**
 * @component SlackMessage
 * @origin v8 — extracted to library on 2026-03-23
 * @description Slack-style chat message bubble supporting both letter-based and image
 *   avatars, optional bot/APP badge, highlighted border, and flexible children content.
 *   Uses Remotion Img for static avatar files and the project theme tokens.
 */
import React from 'react';
import { Img, staticFile } from 'remotion';
import { COLORS, FONTS } from '../theme';

interface SlackMessageProps {
  username: string;
  avatar:
    | { letter: string; color: string }
    | { imageSrc: string }; // Support both letter avatars and image avatars
  timestamp: string;
  children: React.ReactNode;
  isBot?: boolean;
  highlighted?: boolean;
  opacity?: number;
  style?: React.CSSProperties;
}

/** Tara's avatar for convenience — use as: avatar={TARA_AVATAR} */
export const TARA_AVATAR = { imageSrc: staticFile('avatar/tara.png') };

export const SlackMessage: React.FC<SlackMessageProps> = ({
  username,
  avatar,
  timestamp,
  children,
  isBot = false,
  highlighted = false,
  opacity = 1,
  style,
}) => {
  const borderColor =
    'letter' in avatar ? avatar.color : COLORS.amber;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 10,
        padding: '6px 16px 6px 16px',
        fontFamily: FONTS.sans,
        opacity,
        borderLeft: highlighted
          ? `3px solid ${borderColor}`
          : '3px solid transparent',
        backgroundColor: highlighted
          ? `${borderColor}08`
          : 'transparent',
        transition: 'background-color 0.2s',
        ...style,
      }}
    >
      {/* Avatar */}
      {'imageSrc' in avatar ? (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: COLORS.amber,
          }}
        >
          <Img
            src={avatar.imageSrc}
            style={{
              width: 36,
              height: 36,
              objectFit: 'cover',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            backgroundColor: avatar.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.white,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {avatar.letter}
          </span>
        </div>
      )}

      {/* Message body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row: username + badge + timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {username}
          </span>

          {isBot && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.textMuted,
                backgroundColor: COLORS.slackMessage,
                border: `1px solid ${COLORS.slackBorder}`,
                borderRadius: 3,
                padding: '1px 4px',
                letterSpacing: '0.02em',
                lineHeight: 1.3,
                verticalAlign: 'middle',
              }}
            >
              APP
            </span>
          )}

          <span
            style={{
              fontSize: 12,
              color: COLORS.textMuted,
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            {timestamp}
          </span>
        </div>

        {/* Message content */}
        <div
          style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

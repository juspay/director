/**
 * @reference-scene CollabScene
 * @origin v8 — extracted to library 2026-03-23
 * @demonstrates Typing indicators + human-highlight phase + animated reply counter
 * @dependencies React, remotion (useCurrentFrame, interpolate, spring, AbsoluteFill, Img, staticFile), ../theme (COLORS, FONTS, SPRINGS), ../timing (FPS, TRANSITION_FRAMES)
 */
import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  AbsoluteFill,
  Img,
  staticFile,
} from 'remotion';
import { COLORS, FONTS, SPRINGS } from '../theme';
import { FPS, TRANSITION_FRAMES } from '../timing';

// ── Message data ──────────────────────────────────────────────────
interface SlackMessage {
  avatar: string; // letter initial OR 'tara-img' sentinel
  avatarColor: string;
  name: string;
  badge?: string;
  text: string;
  timestamp: string;
  highlightBorder?: string;
  isBot?: boolean;
}

const MESSAGES: SlackMessage[] = [
  {
    avatar: 'S',
    avatarColor: COLORS.purple,
    name: 'Sai Ramcharan',
    text: 'Can we create a Google Ads campaign creation tool for the Lighthouse repo? We need an endpoint that lets PMs spin up campaigns directly.',
    timestamp: '2:14 PM',
    highlightBorder: COLORS.purple,
  },
  {
    avatar: 'tara-img',
    avatarColor: COLORS.amber,
    name: 'TARA',
    badge: 'APP',
    text: 'Found 13 existing tools in the ads server. No campaign creation endpoint exists. Proposing implementation plan with schema validation and budget controls.',
    timestamp: '2:15 PM',
    isBot: true,
  },
  {
    avatar: 'Y',
    avatarColor: COLORS.blue,
    name: 'Yaswanth Reddy',
    text: 'Wait \u2014 why is this in the multi modal server? This belongs in the ads service. Wrong repo entirely.',
    timestamp: '2:31 PM',
    highlightBorder: COLORS.blue,
  },
  {
    avatar: 'Y',
    avatarColor: COLORS.blue,
    name: 'Yaswanth Reddy',
    text: 'Update the existing PR. Remove placeholders. Do actual implementation. Ping me when done.',
    timestamp: '2:48 PM',
    highlightBorder: COLORS.blue,
  },
];

// ── Plan items that accumulate as messages arrive ──────────────────
const PLAN_ITEMS = [
  { label: 'Implement campaign creation endpoint', appearsAt: 1 },
  { label: 'Move to ads service (not multi modal)', appearsAt: 2 },
  { label: 'Remove placeholders \u2014 full implementation', appearsAt: 3 },
];

const MSG_STAGGER = 80; // frames between each message entrance

// ── Typing indicator ─────────────────────────────────────────────

/** Slack-style "is typing..." indicator with bouncing dots */
const TypingIndicator: React.FC<{
  name: string;
  opacity: number;
  frame: number;
}> = ({ name, opacity, frame }) => {
  const dots = [0, 1, 2];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 18px',
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          color: COLORS.textMuted,
          fontStyle: 'italic',
        }}
      >
        {name} is typing
      </span>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {dots.map((d) => {
          const bounce = Math.sin((frame * 0.18) + d * 1.2);
          return (
            <div
              key={d}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: COLORS.textMuted,
                transform: `translateY(${bounce * -2}px)`,
                opacity: 0.4 + bounce * 0.3,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────

const LetterAvatar: React.FC<{
  letter: string;
  color: string;
  size?: number;
}> = ({ letter, color, size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 6,
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONTS.sans,
      fontWeight: 700,
      fontSize: size * 0.44,
      color: COLORS.white,
      flexShrink: 0,
    }}
  >
    {letter}
  </div>
);

const TaraAvatar: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <Img
    src={staticFile('avatar/tara.png')}
    style={{
      width: size,
      height: size,
      borderRadius: 6,
      objectFit: 'cover',
      flexShrink: 0,
    }}
  />
);

const MessageBubble: React.FC<{
  msg: SlackMessage;
  progress: number;
  dimBot: boolean;
  humanGlow: number;
}> = ({ msg, progress, dimBot, humanGlow }) => {
  const slideY = interpolate(progress, [0, 1], [24, 0]);

  const msgOpacity = (() => {
    const base = interpolate(progress, [0, 1], [0, 1]);
    if (dimBot && msg.isBot) return base * 0.45;
    return base;
  })();

  // Human messages get a subtle warm background glow when highlighted
  const isHuman = !msg.isBot;
  const warmBg =
    isHuman && humanGlow > 0
      ? `rgba(217, 119, 6, ${humanGlow * 0.06})`
      : 'transparent';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 18px',
        opacity: msgOpacity,
        transform: `translateY(${slideY}px)`,
        borderLeft: msg.highlightBorder
          ? `3px solid ${msg.highlightBorder}`
          : '3px solid transparent',
        backgroundColor: warmBg,
        borderRadius: 2,
        transition: 'background-color 0.3s ease',
      }}
    >
      {msg.avatar === 'tara-img' ? (
        <TaraAvatar />
      ) : (
        <LetterAvatar letter={msg.avatar} color={msg.avatarColor} />
      )}

      <div style={{ flex: 1 }}>
        {/* Name row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 700,
              fontSize: 15,
              color: msg.isBot ? COLORS.textSecondary : COLORS.textPrimary,
            }}
          >
            {msg.name}
          </span>
          {msg.badge && (
            <span
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                fontWeight: 700,
                color: COLORS.textMuted,
                backgroundColor: COLORS.slackBorder,
                padding: '1px 5px',
                borderRadius: 3,
                letterSpacing: 0.5,
              }}
            >
              {msg.badge}
            </span>
          )}
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 11,
              color: COLORS.textMuted,
              marginLeft: 4,
            }}
          >
            {msg.timestamp}
          </span>
        </div>

        {/* Body */}
        <p
          style={{
            fontFamily: FONTS.sans,
            fontSize: 15,
            lineHeight: 1.55,
            color: COLORS.textSecondary,
            margin: 0,
          }}
        >
          {msg.text}
        </p>
      </div>
    </div>
  );
};

// ── Main Scene ────────────────────────────────────────────────────

export const CollabScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Global entrance / exit ────────────────────────────────────
  const entranceOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const ESTIMATED_DURATION = 1032;
  const exitStart = ESTIMATED_DURATION - TRANSITION_FRAMES;
  const exitOpacity = interpolate(
    frame,
    [exitStart, ESTIMATED_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = Math.min(entranceOpacity, exitOpacity);

  // ── "Humans highlighted" warm glow phase ──────────────────────
  // Ramps up once Yaswanth's first message lands (~msg index 2, delay ~170)
  const humanHighlightPhase = interpolate(
    frame,
    [200, 260, exitStart - 60, exitStart],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Thread container entrance
  const containerSpring = spring({
    frame,
    fps: FPS,
    config: SPRINGS.gentle,
    delay: 10,
  });

  // ── Message progress values ───────────────────────────────────
  const msgProgress = MESSAGES.map((_, i) => {
    const delay = 40 + i * MSG_STAGGER;
    return spring({
      frame,
      fps: FPS,
      config: SPRINGS.gentle,
      delay,
    });
  });

  // ── Plan item progress values ─────────────────────────────────
  const planProgress = PLAN_ITEMS.map((item) => {
    const delay = 40 + item.appearsAt * MSG_STAGGER + 35;
    return spring({
      frame,
      fps: FPS,
      config: SPRINGS.slow,
      delay,
    });
  });

  const dimBot = humanHighlightPhase > 0.3;

  // Warm glow overlay for the whole thread panel
  const glowOpacity = humanHighlightPhase * 0.04;

  // ── Reply counter animation ───────────────────────────────────
  const replyCount = Math.round(
    interpolate(
      frame,
      [40, 40 + MESSAGES.length * MSG_STAGGER + 60],
      [12, 87],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    ),
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        opacity,
        fontFamily: FONTS.sans,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: 60,
          gap: 32,
          boxSizing: 'border-box',
        }}
      >
        {/* ── Left: Slack thread (~60%) ────────────────────────── */}
        <div
          style={{
            flex: 3,
            backgroundColor: COLORS.slackBg,
            borderRadius: 12,
            overflow: 'hidden',
            opacity: containerSpring,
            transform: `translateY(${interpolate(containerSpring, [0, 1], [20, 0])}px)`,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${COLORS.slackBorder}`,
            position: 'relative',
          }}
        >
          {/* Warm amber glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: COLORS.amberLight,
              opacity: glowOpacity,
              pointerEvents: 'none',
              borderRadius: 12,
              zIndex: 10,
            }}
          />

          {/* Thread header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${COLORS.slackBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: COLORS.textPrimary,
                }}
              >
                Thread
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: COLORS.textMuted,
                }}
              >
                #lighthouse
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {replyCount} replies
            </span>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              overflowY: 'hidden',
            }}
          >
            {MESSAGES.map((msg, i) => {
              // Show "TARA is typing..." before Tara's message (index 1)
              const taraTypingVisible = i === 1 && msg.isBot;
              const typingDelay = 40 + i * MSG_STAGGER - 30; // appears 30 frames before message
              const typingOpacity =
                taraTypingVisible
                  ? interpolate(
                      frame,
                      [typingDelay, typingDelay + 10, typingDelay + 30, typingDelay + 35],
                      [0, 0.8, 0.8, 0],
                      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                    )
                  : 0;

              return (
                <React.Fragment key={i}>
                  {taraTypingVisible && typingOpacity > 0 && (
                    <TypingIndicator
                      name="TARA"
                      opacity={typingOpacity}
                      frame={frame}
                    />
                  )}
                  <MessageBubble
                    msg={msg}
                    progress={msgProgress[i]}
                    dimBot={dimBot}
                    humanGlow={humanHighlightPhase}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Right: Plan panel (~40%) ─────────────────────────── */}
        <div
          style={{
            flex: 2,
            opacity: containerSpring,
            transform: `translateY(${interpolate(containerSpring, [0, 1], [20, 0])}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.slackBorder}`,
              padding: 24,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLORS.amber,
                  boxShadow: `0 0 ${6 + Math.sin(frame * 0.1) * 4}px ${COLORS.amber}${Math.round(40 + Math.sin(frame * 0.1) * 30).toString(16).padStart(2, '0')}`,
                  transform: `scale(${1 + Math.sin(frame * 0.1) * 0.15})`,
                }}
              />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: COLORS.textMuted,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                Evolving Plan
              </span>
            </div>

            {/* Plan items */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {PLAN_ITEMS.map((item, i) => {
                const p = planProgress[i];
                // Later items get a blue tint (from Yaswanth's corrections)
                const checkColor = i >= 1 ? COLORS.blue : COLORS.amber;

                // Highlight flash when plan item first appears (reactivity to messages)
                const itemDelay = 40 + item.appearsAt * MSG_STAGGER + 35;
                const highlightOpacity = interpolate(
                  frame,
                  [itemDelay, itemDelay + 8, itemDelay + 20, itemDelay + 38],
                  [0, 1, 0.7, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                );
                const highlightActive = highlightOpacity > 0;

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      opacity: p,
                      transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
                      backgroundColor: highlightActive
                        ? `rgba(217, 119, 6, ${highlightOpacity * 0.12})`
                        : 'transparent',
                      borderLeft: highlightActive
                        ? `3px solid rgba(217, 119, 6, ${highlightOpacity * 0.8})`
                        : '3px solid transparent',
                      borderRadius: 4,
                      padding: '4px 8px',
                      marginLeft: -8,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${checkColor}`,
                        flexShrink: 0,
                        marginTop: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Filled check for items — springy scale-in */}
                      {i >= 1 && p > 0.8 && (() => {
                        const checkScale = interpolate(p, [0.8, 0.9, 1], [0, 1.25, 1], {
                          extrapolateLeft: 'clamp',
                          extrapolateRight: 'clamp',
                        });
                        return (
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              backgroundColor: checkColor,
                              opacity: interpolate(p, [0.8, 0.9], [0, 1], {
                                extrapolateLeft: 'clamp',
                                extrapolateRight: 'clamp',
                              }),
                              transform: `scale(${checkScale})`,
                              boxShadow: checkScale > 1
                                ? `0 0 8px ${checkColor}66`
                                : 'none',
                            }}
                          />
                        );
                      })()}
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        lineHeight: 1.55,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* PR badge that appears after all items */}
            {(() => {
              const prDelay = 40 + 3 * MSG_STAGGER + 80;
              const prProgress = spring({
                frame,
                fps: FPS,
                config: SPRINGS.snappy,
                delay: prDelay,
              });

              return (
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 24,
                    opacity: prProgress,
                    transform: `translateY(${interpolate(prProgress, [0, 1], [8, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      borderRadius: 8,
                      border: `1px solid rgba(34, 197, 94, 0.2)`,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: COLORS.success,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.success,
                        fontFamily: FONTS.mono,
                      }}
                    >
                      PR #4477 created
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

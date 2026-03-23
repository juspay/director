/**
 * @reference-scene MeetTaraScene
 * @origin toplevel — extracted to library 2026-03-23
 * @demonstrates Programmatic D-ID fallback: shimmer particles, orbiting tool badges, gradient animation
 * @dependencies React, remotion (AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring)
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

/**
 * MeetTaraScene — replaces broken D-ID avatar for Act 4.
 *
 * Animated gradient background with:
 *  - "Hi. I'm Tara." intro text
 *  - TARA acronym reveal
 *  - Hindi meaning reveal
 *  - Floating particles for visual richness
 */
export const MeetTaraScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Global fade in/out
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Phase 1: "Hi. I'm Tara." (frames 0-120, ~0-4s)
  const hiOpacity = interpolate(frame, [15, 40, 100, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hiScale = interpolate(frame, [15, 40], [1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2: Acronym "TARA — Threaded AI Resource Agent" (frames 120-320, ~4-10.7s)
  const acronymOpacity = interpolate(
    frame,
    [130, 155, 290, 320],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const acronymSlide = interpolate(frame, [130, 155], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: Hindi meaning "\u0924\u093E\u0930\u093E \u2014 Star" (frames 200-350)
  const hindiOpacity = interpolate(
    frame,
    [210, 235, 320, 350],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Phase 4: Tagline "The teammate who never sleeps." (frames 300-end)
  const taglineOpacity = interpolate(
    frame,
    [310, 340, durationInFrames - 25, durationInFrames - 5],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tool icons that orbit (representing Slack, JIRA, Bitbucket, etc.)
  const toolLabels = ['Slack', 'JIRA', 'Bitbucket', 'GitHub', 'Figma', 'Code'];
  const toolColors = ['#4A154B', '#0052CC', '#2684FF', '#24292F', '#F24E1E', '#22C55E'];

  // Animated gradient shift
  const gradientAngle = 135 + frame * 0.08;

  // Shimmer particles
  const particles = Array.from({ length: 30 }, (_, i) => {
    const seed = i * 137.508;
    const x = (seed * 7.3) % 100;
    const y = (seed * 13.7) % 100;
    const size = 2 + (i % 5) * 1.2;
    const speed = 0.2 + (i % 4) * 0.1;
    const phase = (i * 47) % 360;
    const currentY = (y + frame * speed * 0.3) % 110 - 5;
    const shimmerOpacity = interpolate(
      Math.sin((frame * 0.05 + phase) * Math.PI / 180 * 10),
      [-1, 1],
      [0.05, 0.4]
    );

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${currentY}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 178, 92, ${shimmerOpacity}) 0%, transparent 70%)`,
          boxShadow: `0 0 ${size * 3}px rgba(255, 178, 92, ${shimmerOpacity * 0.5})`,
          pointerEvents: 'none' as const,
        }}
      />
    );
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0F1729 0%, #1E3A5F 35%, #2563EB 65%, #D97706 100%)`,
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Particles */}
      <AbsoluteFill style={{ zIndex: 0 }}>{particles}</AbsoluteFill>

      {/* Central radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,178,92,0.1) 0%, transparent 60%)',
          zIndex: 1,
        }}
      />

      {/* Content container */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        {/* Phase 1: "Hi. I'm Tara." */}
        <div
          style={{
            opacity: hiOpacity,
            transform: `scale(${hiScale})`,
            position: 'absolute',
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: -2,
              textShadow: '0 0 60px rgba(217, 119, 6, 0.4)',
            }}
          >
            Hi. I'm{' '}
            <span style={{ color: '#FFB25C' }}>Tara</span>.
          </span>
        </div>

        {/* Phase 2: Acronym */}
        <div
          style={{
            opacity: acronymOpacity,
            transform: `translateY(${acronymSlide}px)`,
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: 6,
            }}
          >
            <span style={{ color: '#FFB25C' }}>T</span>hreaded{' '}
            <span style={{ color: '#FFB25C' }}>A</span>I{' '}
            <span style={{ color: '#FFB25C' }}>R</span>esource{' '}
            <span style={{ color: '#FFB25C' }}>A</span>gent
          </span>

          {/* Hindi meaning */}
          <div
            style={{
              opacity: hindiOpacity,
              marginTop: 12,
            }}
          >
            <span
              style={{
                fontSize: 36,
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'system-ui, sans-serif',
                fontStyle: 'italic',
              }}
            >
              \u0924\u093E\u0930\u093E \u2014 <em>Star</em> in Hindi
            </span>
          </div>
        </div>

        {/* Phase 4: Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            position: 'absolute',
            bottom: 180,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 500,
              color: '#E2E8F0',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: 1,
            }}
          >
            The teammate who never sleeps.
          </span>
        </div>

        {/* Orbiting tool badges (visible from frame 350+) */}
        {frame >= 350 &&
          toolLabels.map((label, i) => {
            const angle =
              (i / toolLabels.length) * Math.PI * 2 +
              (frame - 350) * 0.008;
            const radius = 320;
            const cx = Math.cos(angle) * radius;
            const cy = Math.sin(angle) * radius * 0.4; // elliptical
            const badgeOpacity = interpolate(
              frame,
              [350, 380, durationInFrames - 20, durationInFrames],
              [0, 0.7, 0.7, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${cx}px - 40px)`,
                  top: `calc(50% + ${cy}px + 60px)`,
                  opacity: badgeOpacity,
                  background: toolColors[i],
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'system-ui, sans-serif',
                  padding: '6px 14px',
                  borderRadius: 20,
                  boxShadow: `0 4px 20px ${toolColors[i]}66`,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            );
          })}
      </AbsoluteFill>

      {/* Top light streak */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,178,92,0.4) 50%, transparent 90%)',
          zIndex: 3,
        }}
      />
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, fonts, FPS } from '../theme';

export const MetricsScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Title: "The Numbers" — frames 0-20
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Counter 1: 0 → 400 — frames 20-90
  const counter1Progress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.slow,
  });
  const counter1Value = Math.round(counter1Progress * 400);

  // Counter 2: 1 → 2 — frames 50-120
  const counter2Progress = spring({
    frame: Math.max(0, frame - 50),
    fps: FPS,
    config: springs.slow,
  });
  const counter2Value = (1 + counter2Progress).toFixed(1);

  // Tagline: "Minutes, not days." — frames 100-150
  const taglineOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [100, 130], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Amber glow pulse on counters: frames 150-170
  const glowAlpha = frame >= 150
    ? interpolate(frame, [150, 160, 170], [0, 0.3, 0], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.canvas.dark }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.sans,
          fontSize: 28,
          color: theme.text.muted,
          opacity: titleOpacity,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}
      >
        The Numbers
      </div>

      {/* Counter 1: Threads */}
      <div
        style={{
          position: 'absolute',
          left: 480,
          top: 400,
          textAlign: 'center',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 'bold',
            fontSize: 120,
            color: theme.amber.primary,
            textShadow: `0 0 ${glowAlpha * 40}px ${theme.amber.primary}`,
          }}
        >
          {counter1Value}+
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 24,
            color: theme.text.secondary,
            marginTop: 8,
          }}
        >
          Threads resolved
        </div>
      </div>

      {/* Counter 2: PR throughput */}
      <div
        style={{
          position: 'absolute',
          left: 1440,
          top: 400,
          textAlign: 'center',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 'bold',
            fontSize: 120,
            color: theme.accent.green,
            textShadow: `0 0 ${glowAlpha * 40}px ${theme.accent.green}`,
          }}
        >
          {counter2Value}x
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 24,
            color: theme.text.secondary,
            marginTop: 8,
          }}
        >
          PR throughput
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          top: 700,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.serif,
          fontSize: 48,
          color: theme.text.primary,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Minutes, not days.
      </div>
    </AbsoluteFill>
  );
};

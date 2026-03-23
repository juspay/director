/**
 * @component CountdownTimer
 * @origin v5 — extracted to library on 2026-03-23
 * @description Large countdown timer with non-linear (quadratic ease-in) acceleration,
 *   pulse effect near zero, intensifying glow, and spring entrance. Formats seconds
 *   as mm:ss and switches to a final "13 minutes" display at zero.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import { COLORS, FONT } from '../theme';

interface CountdownTimerProps {
  /** Frame when the timer first appears */
  delay: number;
  /** Start value in seconds (e.g., 780 = 13:00) */
  startValue: number;
  /** Frame when timer hits 0:00 */
  zeroFrame: number;
  /** Whether the timer should accelerate as it counts down */
  accelerate?: boolean;
}

/**
 * CountdownTimer — Large amber countdown timer for the Hook scene.
 * Shows "13:00" initially, counts down to "0:00" with accelerating speed.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  delay,
  startValue,
  zeroFrame,
  accelerate = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.7 },
  });

  if (frame < delay) return null;

  const opacity = interpolate(enterProgress, [0, 0.3, 1], [0, 1, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(enterProgress, [0, 1], [0.5, 1]);

  // Calculate current time value
  const countdownDuration = zeroFrame - delay;
  const t = interpolate(frame, [delay, zeroFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Accelerating countdown: starts slow, gets faster
  const easedT = accelerate
    ? Easing.in(Easing.quad)(t)
    : t;

  const currentSeconds = Math.max(0, Math.round(startValue * (1 - easedT)));
  const minutes = Math.floor(currentSeconds / 60);
  const secs = currentSeconds % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

  // Pulse effect near zero
  const nearZero = currentSeconds <= 30;
  const pulseSpeed = nearZero ? 0.2 : 0.08;
  const pulse = interpolate(Math.sin((frame - delay) * pulseSpeed), [-1, 1], [0.85, 1.0]);

  // Glow intensifies near zero
  const glowIntensity = interpolate(t, [0, 0.7, 1], [0.3, 0.5, 1.0], { extrapolateRight: 'clamp' });

  // Color shift: amber → brighter amber as it approaches zero
  const isAtZero = currentSeconds === 0;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale * pulse})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: isAtZero ? 180 : 120,
          fontWeight: 900,
          fontFamily: FONT.mono,
          color: isAtZero ? COLORS.accent.amberBright : COLORS.accent.amber,
          letterSpacing: isAtZero ? 8 : 4,
          lineHeight: 1,
          textShadow: `0 0 ${60 * glowIntensity}px rgba(217, 119, 6, ${0.6 * glowIntensity}), 0 0 ${120 * glowIntensity}px rgba(217, 119, 6, ${0.3 * glowIntensity})`,
          transition: 'font-size 0.3s',
        }}
      >
        {isAtZero ? '13 minutes' : timeStr}
      </span>
    </div>
  );
};

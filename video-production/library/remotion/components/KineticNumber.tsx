/**
 * @component KineticNumber
 * @origin v2 — extracted to library on 2026-03-23
 * @description Spring-animated countup number display with shimmer sweep overlay, glow
 *   pulse, staggered label entrance, and decorative draw-on line. Uses spring physics
 *   for both entrance and numeric countup, with a screen-blend shimmer pass.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';

interface KineticNumberProps {
  value: string;
  label: string;
  delay: number;
  holdFrames?: number; // how long to hold before fading out
}

/**
 * Iteration 28: Replaced vertical scroll-snap with spring-based countup
 * that matches the established motion language of the rest of the video.
 * Numbers scale up from 0 with a firm spring + countup animation.
 * Consistent with the spring physics used everywhere else.
 */
export const KineticNumber: React.FC<KineticNumberProps> = ({
  value,
  label,
  delay,
  holdFrames = 75,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Firm professional snap — matches the video's established spring language
  const enterProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.7 },
  });

  // Scale: springs from 0 → overshoot → 1.0 (same feel as other UI elements)
  const scaleSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 8, stiffness: 160, mass: 0.8 },
  });
  // Scale from 0.3 → overshoots slightly → settles at 1.0
  const scale = interpolate(scaleSpring, [0, 1], [0.3, 1]);

  const exitStart = delay + holdFrames;
  const exitOpacity = interpolate(
    frame,
    [exitStart, exitStart + 15],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isVisible = frame >= delay && frame < exitStart + 15;
  if (!isVisible) return null;

  const localFrame = frame - delay;

  // Y offset — springs up from below
  const yOffset = interpolate(enterProgress, [0, 1], [80, 0]);

  // --- Spring-based countup for numeric values ---
  const numericMatch = value.match(/^(\d+)/);
  const targetNumber = numericMatch ? parseInt(numericMatch[1], 10) : null;
  const suffix = numericMatch ? value.slice(numericMatch[1].length) : '';

  // Iteration 44: Tighter countup spring — snappier number arrival
  const countupSpring = spring({
    frame: Math.max(0, frame - delay - 2),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
  });

  let displayValue: string;
  if (targetNumber !== null) {
    const currentVal = Math.round(countupSpring * targetNumber);
    displayValue = `${currentVal}${suffix}`;
  } else {
    displayValue = value;
  }

  // --- Label entrance stagger ---
  const labelSpring = spring({
    frame: Math.max(0, frame - delay - 12),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.7 },
  });
  const labelOpacity = interpolate(labelSpring, [0, 0.3, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(labelSpring, [0, 1], [12, 0]);

  // Decorative line: eased draw using spring
  const lineSpring = spring({
    frame: Math.max(0, frame - delay - 10),
    fps,
    config: SPRING_CONFIG.gentle,
  });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 120]);

  // Shimmer sweep after number settles (synced to spring completion)
  const shimmerProgress = interpolate(
    localFrame,
    [20, 52],
    [-100, 250],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle glow pulse
  const glowPulse = Math.sin(localFrame * 0.12) * 0.35 + 0.65;
  const glowRadius = 80 + glowPulse * 40;
  const glowOpacity = 0.3 + glowPulse * 0.15;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: interpolate(enterProgress, [0, 0.15, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        }) * exitOpacity,
        transform: `translateY(${yOffset}px) scale(${scale})`,
        position: 'absolute',
        inset: 0,
      }}
    >
      {/* Number with shimmer overlay */}
      <div
        style={{
          position: 'relative',
          fontSize: 160,
          fontWeight: 900,
          color: COLORS.accent.amber,
          fontFamily: FONT.heading,
          letterSpacing: -4,
          lineHeight: 1,
          textShadow: `0 0 ${glowRadius}px rgba(217, 119, 6, ${glowOpacity})`,
        }}
      >
        {displayValue}

        {/* Shimmer sweep overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              105deg,
              transparent 0%,
              transparent ${shimmerProgress - 30}%,
              rgba(255, 178, 92, 0.25) ${shimmerProgress - 10}%,
              rgba(255, 255, 255, 0.18) ${shimmerProgress}%,
              rgba(255, 178, 92, 0.25) ${shimmerProgress + 10}%,
              transparent ${shimmerProgress + 30}%,
              transparent 100%
            )`,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Label (staggered entrance) */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 400,
          color: COLORS.text.primary,
          fontFamily: FONT.heading,
          marginTop: 16,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: labelOpacity * exitOpacity * 0.8,
          transform: `translateY(${labelY}px)`,
        }}
      >
        {label}
      </div>

      {/* Decorative line with eased draw */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.accent.amber}, transparent)`,
          marginTop: 24,
          opacity: interpolate(lineSpring, [0, 0.3], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </div>
  );
};

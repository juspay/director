/** @component InvestigationNode @origin v2 — extracted to library 2026-03-23 @description Node with 3 layered micro-animations: spring entrance with overshoot, breathing pulse + float drift, and ambient glow ring pulsing */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';

interface InvestigationNodeProps {
  icon: string; // emoji or text character
  label: string;
  x: number;
  y: number;
  delay: number;
  color: string;
}

export const InvestigationNode: React.FC<InvestigationNodeProps> = ({
  icon,
  label,
  x,
  y,
  delay,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Iteration 14: Professional snappy spring — damping 7 for tight, controlled entrance
  const enterProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 11, stiffness: 200, mass: 0.7 },
  });

  if (frame < delay) return null;

  const scale = interpolate(enterProgress, [0, 1], [0, 1]); // NO clamp — damping 11 gives subtle overshoot
  const opacity = interpolate(enterProgress, [0, 0.4, 1], [0, 1, 1], { extrapolateRight: 'clamp' });

  // Breathing pulse AFTER entrance settles (starts ~30 frames in)
  const entranceSettled = Math.min(1, Math.max(0, (frame - delay - 25) / 10)); // ramp 0→1 over frames 25-35
  const breatheScale = 1 + entranceSettled * 0.03 * Math.sin((frame - delay) * 0.06);
  const breatheOpacity = 1 - entranceSettled * 0.08 * (0.5 - 0.5 * Math.cos((frame - delay) * 0.08));

  // Iteration 45: Reduced drift from 2px to 1px — Gemini says it's still distracting
  const floatPhase = (frame - delay) * 0.015;
  const floatX = 0;
  const floatY = entranceSettled * Math.sin(floatPhase) * 1;

  // Subtle ambient pulse on glow ring
  const pulse = interpolate(
    Math.sin((frame - delay) * 0.08),
    [-1, 1],
    [0.82, 1.05]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(calc(-50% + ${floatX}px), calc(-50% + ${floatY}px)) scale(${scale * breatheScale})`,
        opacity: opacity * breatheOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Glow ring */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${pulse})`,
        }}
      >
        {/* Inner circle */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: COLORS.bg.secondary,
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5), 0 0 24px ${color}40, 0 8px 24px rgba(0, 0, 0, 0.3)`,
          }}
        >
          <span style={{ fontSize: 24 }}>{icon}</span>
        </div>
      </div>

      {/* Label */}
      <span
        style={{
          color: COLORS.text.label,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT.body,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
};

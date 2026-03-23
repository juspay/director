/**
 * @component ProgressTrack
 * @origin v5 — extracted to library on 2026-03-23
 * @description Animated horizontal progress bar with staccato burst-and-plateau algorithm,
 *   energy shimmer pulse, pulsing leading-edge dot, and per-step SVG checkmark draw-on.
 *   Cleanest implementation of the burst-progress timing pattern.
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import { COLORS, FONT } from '../theme';

interface ProgressTrackProps {
  branchName: string;
  steps: string[];
  color: string;
  delay: number;
  completionFrame: number;
}

export const ProgressTrack: React.FC<ProgressTrackProps> = ({
  branchName,
  steps,
  color,
  delay,
  completionFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 6, stiffness: 140, mass: 0.8 },
  });

  if (frame < delay) return null;

  // Burst progress — staccato jumps + plateaus
  const progressDuration = completionFrame - delay;
  const t = interpolate(frame, [delay, delay + progressDuration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const burstProgress = (() => {
    if (t <= 0) return 0;
    if (t <= 0.10) return interpolate(t, [0, 0.10], [0, 0.28], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
    if (t <= 0.22) return interpolate(t, [0.10, 0.22], [0.28, 0.30], { extrapolateRight: 'clamp' });
    if (t <= 0.32) return interpolate(t, [0.22, 0.32], [0.30, 0.55], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
    if (t <= 0.45) return interpolate(t, [0.32, 0.45], [0.55, 0.57], { extrapolateRight: 'clamp' });
    if (t <= 0.55) return interpolate(t, [0.45, 0.55], [0.57, 0.80], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
    if (t <= 0.70) return interpolate(t, [0.55, 0.70], [0.80, 0.82], { extrapolateRight: 'clamp' });
    return interpolate(t, [0.70, 1.0], [0.82, 1.0], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
  })();

  const displayProgress = Math.min(1.0, burstProgress);

  const edgePulse = interpolate(Math.sin((frame - delay) * 0.15), [-1, 1], [0.4, 1.0]);
  const opacity = interpolate(enterProgress, [0, 0.5, 1], [0, 1, 1], { extrapolateRight: 'clamp' });
  const translateX = interpolate(enterProgress, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        maxWidth: 900,
      }}
    >
      {/* Branch label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}80`,
          }}
        />
        <span style={{ color: COLORS.text.primary, fontSize: 16, fontWeight: 600, fontFamily: FONT.mono }}>
          {branchName}
        </span>
      </div>

      {/* Track bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: COLORS.bg.surface,
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${displayProgress * 100}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: color,
            boxShadow: `0 0 16px ${color}60`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Energy shimmer pulse traveling along the bar */}
          {displayProgress > 0.05 && displayProgress < 1.0 && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                bottom: -2,
                width: 40,
                left: `${interpolate(
                  ((frame - delay) * 0.03) % 1,
                  [0, 1],
                  [-10, 110],
                )}%`,
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)`,
                borderRadius: 3,
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              right: -4,
              top: -5,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              opacity: edgePulse * (displayProgress > 0.01 ? 1 : 0),
              transform: `scale(${0.8 + edgePulse * 0.4})`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Step labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        {steps.map((step, i) => {
          const stepThreshold = (i + 1) / steps.length;
          const isComplete = burstProgress >= stepThreshold;
          const isActive = burstProgress >= i / steps.length && burstProgress < stepThreshold;

          const checkSpring = spring({
            frame: isComplete ? Math.max(0, frame - (delay + progressDuration * stepThreshold)) : 0,
            fps,
            config: { damping: 7, stiffness: 150, mass: 0.6 },
          });
          const dotScale = isComplete ? interpolate(checkSpring, [0, 1], [0.3, 1]) : 1;

          const labelEnterFrame = delay + i * 4;
          const labelSpring = spring({
            frame: Math.max(0, frame - labelEnterFrame),
            fps,
            config: { damping: 10, stiffness: 120, mass: 0.8 },
          });
          const labelOpacity = interpolate(labelSpring, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });
          const labelSlideY = interpolate(labelSpring, [0, 1], [8, 0]);

          return (
            <div
              key={step}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
                opacity: labelOpacity,
                transform: `translateY(${labelSlideY}px)`,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: isComplete ? color : isActive ? `${color}60` : COLORS.bg.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${dotScale})`,
                }}
              >
                {isComplete && (() => {
                  const checkPathLength = 16;
                  const drawOnAge = Math.max(0, frame - (delay + progressDuration * stepThreshold));
                  const drawProgress = interpolate(drawOnAge, [0, 15], [0, 1], {
                    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                    easing: Easing.out(Easing.cubic),
                  });
                  return (
                    <svg width="10" height="10" viewBox="0 0 12 12">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={checkPathLength}
                        strokeDashoffset={checkPathLength * (1 - drawProgress)}
                      />
                    </svg>
                  );
                })()}
              </div>
              <span
                style={{
                  color: isComplete ? COLORS.text.primary : isActive ? COLORS.text.label : COLORS.text.secondary,
                  fontSize: 10,
                  fontFamily: FONT.body,
                  textAlign: 'center',
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

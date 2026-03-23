/**
 * @effect TransitionOverlays
 * @origin v8 — extracted 2026-03-23
 * @description Six named transition overlay components designed to layer ON TOP
 *   of scene Sequences during crossfade windows.  Each creates a distinct visual
 *   bridge: amber pulses, scale-dissolves, horizontal streaks, convergence flashes,
 *   hub contractions, and zoom-blur effects.
 *
 * Usage:
 *   import { Sequence } from 'remotion';
 *   import { CollabToExecutionTransition } from './transitionOverlays';
 *
 *   <Sequence from={transitionStart} durationInFrames={30}>
 *     <CollabToExecutionTransition />
 *   </Sequence>
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

// ── Color tokens (self-contained — no external theme dependency) ──────────────
const AMBER = '#d97706';
const AMBER_LIGHT = '#ffb25c';
const AMBER_DIM = 'rgba(217, 119, 6, 0.3)';
const WHITE = '#f8fafc';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HookToMeetTaraTransition
//    Brief amber radial flash + thread line drawing downward.
//    Duration: 20 frames.
// ═══════════════════════════════════════════════════════════════════════════════

export interface HookToMeetTaraTransitionProps {
  /** Total duration of this overlay in frames.  Default: 20 */
  durationFrames?: number;
}

export const HookToMeetTaraTransition: React.FC<HookToMeetTaraTransitionProps> = ({
  durationFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationFrames;

  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.3, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const lineLength = interpolate(progress, [0, 0.8], [0, 200], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const lineOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.7, 0.5, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${AMBER}30 0%, transparent 70%)`,
          opacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 480,
          width: 2,
          height: lineLength,
          background: `linear-gradient(180deg, ${AMBER_LIGHT}, ${AMBER}88, transparent)`,
          opacity: lineOpacity,
          transform: 'translateX(-50%)',
          boxShadow: `0 0 8px ${AMBER}44`,
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MeetTaraToCollabTransition
//    Soft scale-dissolve with converging dots.
//    Duration: 30 frames.
// ═══════════════════════════════════════════════════════════════════════════════

export interface MeetTaraToCollabTransitionProps {
  durationFrames?: number;
  dotCount?: number;
}

export const MeetTaraToCollabTransition: React.FC<MeetTaraToCollabTransitionProps> = ({
  durationFrames = 30,
  dotCount = 6,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationFrames;

  const radius = interpolate(progress, [0, 1], [0, 120], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bgOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.12, 0.12, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const scale = interpolate(progress, [0, 1], [0.98, 1.02], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${AMBER}18 0%, transparent ${radius}%)`,
          opacity: bgOpacity,
          transform: `scale(${scale})`,
        }}
      />
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * Math.PI * 2;
        const startR = 400;
        const startX = 960 + Math.cos(angle) * startR;
        const startY = 540 + Math.sin(angle) * startR;
        const pDelay = i * 0.06;
        const pProgress = interpolate(progress, [pDelay, pDelay + 0.7], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const eased = pProgress * pProgress;
        const px = startX + (960 - startX) * eased;
        const py = startY + (540 - startY) * eased;
        const dotOpacity = interpolate(pProgress, [0, 0.15, 0.7, 1], [0, 0.6, 0.5, 0]);

        return (
          <div
            key={`cd-${i}`}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: AMBER_LIGHT,
              boxShadow: `0 0 8px ${AMBER}66`,
              opacity: dotOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CollabToExecutionTransition
//    Quick horizontal amber streak with trailing line and scale pulse.
//    Duration: 30 frames.
// ═══════════════════════════════════════════════════════════════════════════════

export interface CollabToExecutionTransitionProps {
  durationFrames?: number;
}

export const CollabToExecutionTransition: React.FC<CollabToExecutionTransitionProps> = ({
  durationFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationFrames;

  const lineX = interpolate(progress, [0, 1], [-200, 2200], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const lineOpacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 0.7, 0.6, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const trailX = interpolate(progress, [0.08, 1], [-200, 2200], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const trailOpacity = interpolate(progress, [0.08, 0.25, 0.85, 1], [0, 0.35, 0.3, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const pulseScale = interpolate(progress, [0.3, 0.5, 0.7], [1.0, 1.015, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', transform: `scale(${pulseScale})` }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: lineX,
          width: 300,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER}, ${AMBER_LIGHT}, transparent)`,
          opacity: lineOpacity,
          transform: 'translateY(-50%)',
          boxShadow: `0 0 12px ${AMBER}60, 0 0 24px ${AMBER}30`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% + 8px)',
          left: trailX,
          width: 180,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${AMBER}AA, ${AMBER_LIGHT}88, transparent)`,
          opacity: trailOpacity,
          transform: 'translateY(-50%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${AMBER}10 0%, transparent 60%)`,
          opacity: interpolate(progress, [0.3, 0.5, 0.7], [0, 0.10, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ExecutionToReachTransition
//    Convergence flash with concentric rings and converging spark particles.
//    Duration: 40 frames.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExecutionToReachTransitionProps {
  durationFrames?: number;
  particleCount?: number;
  ringCount?: number;
  centerX?: number;
  centerY?: number;
}

export const ExecutionToReachTransition: React.FC<ExecutionToReachTransitionProps> = ({
  durationFrames = 40,
  particleCount = 8,
  ringCount = 6,
  centerX = 960,
  centerY = 540,
}) => {
  const frame = useCurrentFrame();
  const t = frame / durationFrames;

  const flashOpacity = interpolate(frame, [10, 20, 30, 40], [0, 0.85, 0.3, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const flashScale = interpolate(frame, [10, 20, 35], [0.3, 1.0, 1.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Central convergence flash */}
      <div
        style={{
          position: 'absolute',
          left: centerX,
          top: centerY,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${AMBER_LIGHT}DD 0%, ${AMBER}88 30%, ${AMBER_DIM}44 60%, transparent 100%)`,
          opacity: flashOpacity,
          transform: `translate(-50%, -50%) scale(${flashScale})`,
        }}
      />
      {/* Bright core dot */}
      <div
        style={{
          position: 'absolute',
          left: centerX,
          top: centerY,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: WHITE,
          opacity: interpolate(frame, [14, 20, 28, 38], [0, 1, 0.5, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
          boxShadow: `0 0 30px ${AMBER_LIGHT}, 0 0 60px ${AMBER}AA`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Expanding concentric rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const ringStart = 12 + i * 3;
        const ringProgress = interpolate(frame, [ringStart, ringStart + 20], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const ringRadius = interpolate(ringProgress, [0, 1], [10, 180 + i * 50]);
        const ringOpacity = interpolate(ringProgress, [0, 0.2, 0.6, 1], [0, 0.7 - i * 0.08, 0.3, 0]);
        const ringWidth = interpolate(ringProgress, [0, 1], [3, 1]);

        return (
          <div
            key={`ring-${i}`}
            style={{
              position: 'absolute',
              left: centerX,
              top: centerY,
              width: ringRadius * 2,
              height: ringRadius * 2,
              borderRadius: '50%',
              border: `${ringWidth}px solid ${AMBER_LIGHT}`,
              opacity: ringOpacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${8 + i * 2}px ${AMBER}44`,
            }}
          />
        );
      })}

      {/* Converging particles */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const angleRad = (i / particleCount) * Math.PI * 2;
        const edgeRadius = 500;
        const startX = centerX + Math.cos(angleRad) * edgeRadius;
        const startY = centerY + Math.sin(angleRad) * edgeRadius;
        const pDelay = i * 0.04;
        const pProgress = interpolate(t, [pDelay, pDelay + 0.6], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const eased = pProgress * pProgress;
        const px = startX + (centerX - startX) * eased;
        const py = startY + (centerY - startY) * eased;
        const size = 5 + (i % 3) * 2;
        const pOpacity = interpolate(pProgress, [0, 0.15, 0.75, 1], [0, 0.9, 0.7, 0]);

        return (
          <div
            key={`cp-${i}`}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: AMBER_LIGHT,
              boxShadow: `0 0 ${size * 3}px ${AMBER}99`,
              opacity: pOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ReachToPayoffTransition
//    Hub contraction + horizontal amber streak (right-to-left).
//    Duration: 30 frames.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReachToPayoffTransitionProps {
  durationFrames?: number;
}

export const ReachToPayoffTransition: React.FC<ReachToPayoffTransitionProps> = ({
  durationFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationFrames;

  const contractScale = interpolate(progress, [0, 0.5, 1], [1.0, 0.85, 0.7], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const contractOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.15, 0.1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const streakX = interpolate(progress, [0.2, 1], [2200, -300], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const streakOpacity = interpolate(progress, [0.2, 0.4, 0.8, 1], [0, 0.7, 0.5, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 43%, ${AMBER}15 0%, transparent 40%)`,
          opacity: contractOpacity,
          transform: `scale(${contractScale})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: streakX,
          width: 400,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER_LIGHT}, ${AMBER}, transparent)`,
          opacity: streakOpacity,
          transform: 'translateY(-50%)',
          boxShadow: `0 0 16px ${AMBER}50, 0 0 32px ${AMBER}25`,
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PayoffToIdentityTransition
//    Subtle zoom-into-center with blur pulse.
//    Duration: 2x transition frames (parameterized).
// ═══════════════════════════════════════════════════════════════════════════════

export interface PayoffToIdentityTransitionProps {
  /** Total duration of this overlay in frames.  Default: 30 */
  durationFrames?: number;
}

export const PayoffToIdentityTransition: React.FC<PayoffToIdentityTransitionProps> = ({
  durationFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationFrames;

  const scale = interpolate(progress, [0, 1], [1.0, 1.05], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const blur = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const opacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.15, 0.15, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(15, 23, 42, 0.25) 100%)`,
          opacity,
          filter: `blur(${blur}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

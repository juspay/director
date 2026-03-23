/**
 * @component AnimatedDotGrid
 * @origin v5 — extracted to library on 2026-03-23
 * @description Persistent animated background dot grid with impact-reactive ripple waves.
 *   Dots drift, breathe, and respond to impact events via expanding wavefronts that
 *   brighten and push nearby dots outward. Uses Remotion interpolate for decay curves.
 */
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../theme';

/**
 * AnimatedDotGrid — Persistent animated background visible in EVERY scene.
 * v5 iter3: Reactive — dots pulse in response to impact events and music rhythm.
 *
 * Props:
 *   impactFrames - array of { frame, x, y, radius, intensity } for reactive pulses
 */

interface Impact {
  frame: number;
  x: number;
  y: number;
  radius?: number;
  intensity?: number;
}

interface AnimatedDotGridProps {
  impactFrames?: Impact[];
}

const GRID_COLS = 16;
const GRID_ROWS = 10;
const SPACING_X = 1920 / (GRID_COLS + 1);
const SPACING_Y = 1080 / (GRID_ROWS + 1);

const DOTS = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  const seed = (i * 137.508) % 1;
  return {
    baseX: SPACING_X * (col + 1),
    baseY: SPACING_Y * (row + 1),
    phase: seed * Math.PI * 2,
    driftAmpX: 2 + seed * 4,
    driftAmpY: 1.5 + seed * 3,
    driftSpeedX: 0.008 + seed * 0.005,
    driftSpeedY: 0.009 + seed * 0.004,
    breathSpeed: 0.03 + seed * 0.025,
    baseOpacity: 0.015 + seed * 0.03,
    size: 2 + seed * 1.5,
  };
});

export const AnimatedDotGrid: React.FC<AnimatedDotGridProps> = ({ impactFrames = [] }) => {
  const frame = useCurrentFrame();

  // Subtle music rhythm pulse (global)
  const rhythmPulse = Math.sin(frame * 0.12) * 0.15 + 1;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {DOTS.map((dot, i) => {
        const x = dot.baseX + Math.sin(frame * dot.driftSpeedX + dot.phase) * dot.driftAmpX;
        const y = dot.baseY + Math.cos(frame * dot.driftSpeedY + dot.phase * 1.3) * dot.driftAmpY;
        let breathingOpacity = dot.baseOpacity * (1 + Math.sin(frame * dot.breathSpeed + dot.phase) * 0.4);

        // Subtle rhythm modulation
        breathingOpacity *= rhythmPulse;

        // Reactive impact pulses — dots near impact brighten and push outward
        let impactBrightness = 0;
        let impactPushX = 0;
        let impactPushY = 0;

        for (const impact of impactFrames) {
          const age = frame - impact.frame;
          if (age < 0 || age > 45) continue;

          const impactRadius = impact.radius ?? 600;
          const impactIntensity = impact.intensity ?? 1;
          const dx = x - impact.x;
          const dy = y - impact.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Ripple wave: expands outward from impact point
          const waveRadius = age * 20; // pixels per frame
          const waveProximity = Math.abs(dist - waveRadius);
          const waveInfluence = waveProximity < 80
            ? interpolate(waveProximity, [0, 80], [1, 0], { extrapolateRight: 'clamp' })
            : 0;

          const waveDecay = interpolate(age, [0, 45], [impactIntensity, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          impactBrightness += waveInfluence * waveDecay * 0.08;

          // Push dots slightly outward from impact
          if (dist > 0 && dist < impactRadius) {
            const pushForce = waveInfluence * waveDecay * 3;
            impactPushX += (dx / dist) * pushForce;
            impactPushY += (dy / dist) * pushForce;
          }
        }

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + impactPushX,
              top: y + impactPushY,
              width: dot.size,
              height: dot.size,
              borderRadius: '50%',
              backgroundColor: COLORS.accent.amberLight,
              opacity: Math.min(breathingOpacity + impactBrightness, 0.15),
            }}
          />
        );
      })}
    </div>
  );
};

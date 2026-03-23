/**
 * @effect ParticleDebris
 * @origin v5 — extracted 2026-03-23
 * @description 16-particle debris burst system with motion-blur streak rendering.
 *   Particles explode outward from a focal point with configurable angular
 *   distribution, speed tiers, color mapping, and directional streak trails.
 *   Designed for impact moments (fork splits, collisions, shatter effects).
 *
 * Usage:
 *   <ParticleDebris
 *     originX={960}
 *     originY={260}
 *     triggerFrame={70}
 *     colors={['#d97706', '#3b82f6', '#22c55e']}
 *   />
 */

import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

// ── Particle definition ───────────────────────────────────────────────────────

export interface DebrisParticle {
  /** Angle of travel in radians. */
  angle: number;
  /** Speed multiplier (pixels per frame). */
  speed: number;
  /** Base width of the particle in pixels. */
  size: number;
  /** Index into the color palette. */
  hue: number;
}

/**
 * Generate a deterministic array of debris particles.
 * Uses golden-angle offset for even angular distribution.
 */
export function generateDebrisParticles(count: number = 16): DebrisParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + i * 0.37,
    speed: 2 + (i % 4) * 1.5,
    size: 3 + (i % 3) * 2,
    hue: i % 3,
  }));
}

// ── Default 16-particle set (matches v5 ExecutionScene) ───────────────────────
const DEFAULT_PARTICLES = generateDebrisParticles(16);

// ── Component props ───────────────────────────────────────────────────────────

export interface ParticleDebrisProps {
  /** X center of the explosion origin. */
  originX: number;
  /** Y center of the explosion origin. */
  originY: number;
  /** Frame at which the burst begins (scene-relative). */
  triggerFrame: number;
  /** Ordered color palette — particles cycle through by index.  Default: amber/blue/green. */
  colors?: string[];
  /** Number of particles.  Default: 16 */
  count?: number;
  /** Custom particle array (overrides count when provided). */
  particles?: DebrisParticle[];
  /** Total burst duration in frames.  Default: 40 */
  durationFrames?: number;
  /** Delay after triggerFrame before particles start moving.  Default: 10 */
  delayFrames?: number;
  /** Peak opacity of each particle.  Default: 0.8 */
  peakOpacity?: number;
  /** Upward drift per frame (negative = upward).  Default: -0.3 */
  driftY?: number;
  /** Maximum streak length in pixels (caps motion-blur trail).  Default: 30 */
  maxStreakLength?: number;
  /** Glow radius multiplier applied to boxShadow.  Default: 3 */
  glowMultiplier?: number;
}

export const ParticleDebris: React.FC<ParticleDebrisProps> = ({
  originX,
  originY,
  triggerFrame,
  colors = ['#d97706', '#3b82f6', '#22c55e'],
  count = 16,
  particles,
  durationFrames = 40,
  delayFrames = 10,
  peakOpacity = 0.8,
  driftY = -0.3,
  maxStreakLength = 30,
  glowMultiplier = 3,
}) => {
  const frame = useCurrentFrame();
  const effectiveParticles = particles ?? generateDebrisParticles(count);

  const burstStart = triggerFrame + delayFrames;
  const burstAge = frame - burstStart;

  // Early-out: nothing to render outside the active window
  if (burstAge < 0 || burstAge >= durationFrames) return null;

  // Global decay envelope
  const decay = interpolate(burstAge, [0, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      {effectiveParticles.map((p, i) => {
        // Distance traveled
        const dist = p.speed * burstAge;
        const dx = Math.cos(p.angle) * dist;
        const dy = Math.sin(p.angle) * dist + burstAge * driftY;

        const color = colors[p.hue % colors.length];

        // Scale animation: quick pop then shrink
        const scale = interpolate(burstAge, [0, 5, durationFrames], [0, 1, 0.3], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Motion blur streak — oriented along the travel direction
        const streakAngleDeg = (p.angle * 180) / Math.PI;
        const streakLength = Math.min(p.speed * 8, maxStreakLength);

        return (
          <div
            key={`debris-${i}`}
            style={{
              position: 'absolute',
              left: originX + dx,
              top: originY + dy,
              width: p.size,
              height: streakLength,
              borderRadius: p.size / 2,
              background: `linear-gradient(180deg, ${color} 0%, ${color}40 60%, transparent 100%)`,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${streakAngleDeg + 90}deg)`,
              opacity: decay * peakOpacity,
              boxShadow: `0 0 ${p.size * glowMultiplier}px ${color}80`,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
};

export default ParticleDebris;

/**
 * @reference-scene ExecutionScene
 * @origin v5 — extracted to library 2026-03-23
 * @demonstrates Chromatic aberration + debris particles + fork shatter
 * @dependencies COLORS, FONT, SPRING_CONFIG from theme; MORPH_OVERLAP from durations; ProgressTrack, ResultBadge, ConnectionLine from components
 */
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing, AbsoluteFill } from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';
import { MORPH_OVERLAP } from '../durations';
import { ProgressTrack } from '../components/ProgressTrack';
import { ResultBadge } from '../components/ResultBadge';
import { ConnectionLine } from '../components/ConnectionLine';

/**
 * Scene 4 — ExecutionScene
 * Duration: 26.0s = 780 frames @ 30fps
 *
 * "Make it real." — The plan splits into three parallel branches.
 * Tara clones repos, writes code matching team patterns, opens PRs.
 * Three PRs, one conversation.
 */

// ── Branch configuration ─────────────────────────────────────────────────────
const BRANCHES = [
  { name: 'feature/auth-fix', color: '#3b82f6', delay: 120, completionFrame: 420 },
  { name: 'feature/mobile-viewport', color: '#22c55e', delay: 140, completionFrame: 460 },
  { name: 'feature/payment-edge', color: '#a855f7', delay: 160, completionFrame: 500 },
] as const;

const STEPS = ['Clone', 'Analyze', 'Implement', 'Test', 'PR'] as const;

const PR_BADGES = [
  { label: 'PR #3847', color: '#3b82f6', delay: 550 },
  { label: 'PR #3848', color: '#22c55e', delay: 570 },
  { label: 'PR #3849', color: '#a855f7', delay: 590 },
] as const;

// ── Screen-shake helper (enhanced: stronger amplitude, longer decay) ─────────
function useScreenShake(frame: number, startFrame: number): { x: number; y: number } {
  const shakeAge = frame - startFrame;
  if (shakeAge < 0 || shakeAge > 18) return { x: 0, y: 0 };

  const decay = interpolate(shakeAge, [0, 18], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Stronger deterministic pseudo-random shake using sin — 12px amplitude (was 8)
  const x = Math.sin(shakeAge * 7.3) * 12 * decay;
  const y = Math.cos(shakeAge * 5.7) * 12 * decay;
  return { x, y };
}

// ── Debris particle positions (deterministic, scattered from fork point) ─────
const DEBRIS_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * Math.PI * 2 + (i * 0.37),
  speed: 2 + (i % 4) * 1.5,
  size: 3 + (i % 3) * 2,
  hue: i % 3, // 0=amber, 1=blue, 2=green — matches branch colors
}));

export const ExecutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Timing constants ────────────────────────────────────────────────────
  const SCENE_DURATION = 780;
  const MAKE_REAL_HOLD = 60;
  const FORK_START = 60;
  const FORK_END = 90;
  const LABEL_START = 90;
  const TRACKS_START = 120;
  const PR_SECTION = 540;
  const TAGLINE_START = 660;
  const MORPH_EXIT_START = SCENE_DURATION - MORPH_OVERLAP; // 735

  // ── MORPH IN: Scene entrance ───────────────────────────────────────────
  const morphIn = spring({
    frame,
    fps,
    config: SPRING_CONFIG.graphSnap,
  });
  const sceneOpacity = interpolate(morphIn, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── MORPH OUT: Final fade ─────────────────────────────────────────────
  const morphOutOpacity = interpolate(
    frame,
    [MORPH_EXIT_START, SCENE_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Screen shake at fork point ─────────────────────────────────────────
  const shake = useScreenShake(frame, FORK_START + 15);

  // ── Chromatic aberration pulse at fork ─────────────────────────────────
  const chromaAge = frame - FORK_START - 12;
  const chromaIntensity = chromaAge >= 0 && chromaAge < 15
    ? interpolate(chromaAge, [0, 3, 15], [0, 4, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  // ── Push-back effect at fork ───────────────────────────────────────────
  const pushbackSpring = spring({
    frame: Math.max(0, frame - FORK_START - 10),
    fps,
    config: SPRING_CONFIG.forkPushback,
  });
  const pushbackScale = frame >= FORK_START + 10
    ? interpolate(pushbackSpring, [0, 0.3, 1], [1, 0.98, 1], { extrapolateRight: 'clamp' })
    : 1;

  // ── "Make it real." message ────────────────────────────────────────────
  const makeRealEnter = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: SPRING_CONFIG.snappy,
  });
  const makeRealOpacity = interpolate(makeRealEnter, [0, 0.3, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });
  const makeRealScale = interpolate(makeRealEnter, [0, 1], [0.85, 1]);

  // Message fades upward and out after fork
  const makeRealFade = interpolate(frame, [FORK_START, FORK_START + 25], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const makeRealLift = interpolate(frame, [FORK_START, FORK_START + 25], [0, -60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Intensifying amber glow before the fork
  const preGlowIntensity = interpolate(frame, [30, FORK_START], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowRadius = 20 + preGlowIntensity * 30;

  // ── SVG Y-fork animation ──────────────────────────────────────────────
  const forkAge = Math.max(0, frame - FORK_START);

  // Stem: draws downward over 20 frames
  const stemProgress = interpolate(forkAge, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Three branches: staggered 5 frames each, 15 frames to draw
  const branch1Progress = interpolate(forkAge, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const branch2Progress = interpolate(forkAge, [20, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const branch3Progress = interpolate(forkAge, [25, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Ripple burst from fork point
  const rippleAge = Math.max(0, forkAge - 15);
  const rippleRadius = interpolate(rippleAge, [0, 30], [0, 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rippleOpacity = interpolate(rippleAge, [0, 30], [0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Fork SVG geometry ─────────────────────────────────────────────────
  // Center of the screen, below the "Make it real" text
  const forkCenterX = 960;
  const forkTopY = 180;
  const forkSplitY = 260;
  const branchEndY = 330;

  // Three branch endpoints: left, center-right, right
  const branchEndpoints = [
    { x: 540, y: branchEndY },     // left
    { x: 960, y: branchEndY },     // center
    { x: 1380, y: branchEndY },    // right
  ];

  // Stem path length for dashoffset
  const stemLength = forkSplitY - forkTopY;

  // Branch cubic bezier paths
  const branchPaths = branchEndpoints.map((end) => {
    const cpY = forkSplitY + (branchEndY - forkSplitY) * 0.4;
    return `M ${forkCenterX} ${forkSplitY} C ${forkCenterX} ${cpY} ${end.x} ${cpY} ${end.x} ${end.y}`;
  });

  // Estimated path lengths for dashoffset animation
  const branchLengths = branchEndpoints.map((end) => {
    const dx = end.x - forkCenterX;
    const dy = branchEndY - forkSplitY;
    return Math.sqrt(dx * dx + dy * dy) * 1.3; // Approximate bezier length
  });

  // ── Branch labels (90-120) ────────────────────────────────────────────
  const labelEntries = BRANCHES.map((b, i) => {
    const labelDelay = LABEL_START + i * 8;
    const labelSpring = spring({
      frame: Math.max(0, frame - labelDelay),
      fps,
      config: SPRING_CONFIG.snappy,
    });
    const labelOpacity = interpolate(labelSpring, [0, 0.3, 1], [0, 1, 1], {
      extrapolateRight: 'clamp',
    });
    const labelScale = interpolate(labelSpring, [0, 1], [0.6, 1]);
    return { opacity: labelOpacity, scale: labelScale, delay: labelDelay };
  });

  // ── PR section (540-660) ──────────────────────────────────────────────
  // Position badges on the right side
  const badgeCenterX = 1200;
  const badgeStartY = 420;
  const badgeGap = 70;

  // Thread indicator position (left side) for connection lines
  const threadIndicatorX = 200;
  const threadIndicatorY = 500;

  // ── Tagline: "3 PRs. 1 conversation." (660-780) ──────────────────────
  const taglineDelay = TAGLINE_START;
  const taglineSpring = spring({
    frame: Math.max(0, frame - taglineDelay),
    fps,
    config: SPRING_CONFIG.bouncy,
  });
  const taglineOpacity = interpolate(taglineSpring, [0, 0.3, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(taglineSpring, [0, 1], [30, 0]);
  const taglineScale = interpolate(taglineSpring, [0, 1], [0.9, 1]);

  // Tagline breathing glow
  const taglineAge = Math.max(0, frame - taglineDelay);
  const taglineGlow = interpolate(
    Math.sin(taglineAge * 0.06),
    [-1, 1],
    [0.3, 0.7],
  );

  // ── PR badge scale breathing in last 45 frames ────────────────────────
  const badgePulsePhase = frame >= MORPH_EXIT_START
    ? interpolate(
        Math.sin((frame - MORPH_EXIT_START) * 0.2),
        [-1, 1],
        [1.0, 1.05],
      )
    : 1;

  // ── Fork fade: fork + labels fade as tracks take over ─────────────────
  const forkFade = interpolate(frame, [TRACKS_START + 30, TRACKS_START + 60], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        opacity: sceneOpacity * morphOutOpacity,
      }}
    >
      {/* Ambient gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 50% 40% at 50% 30%, ${COLORS.accent.amberSubtle}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Chromatic aberration overlay at fork */}
      {chromaIntensity > 0.5 && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${chromaIntensity}px, 0)`,
              mixBlendMode: 'screen',
              opacity: chromaIntensity * 0.06,
              background: `radial-gradient(circle at 50% 25%, rgba(59, 130, 246, 0.3), transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${-chromaIntensity}px, 0)`,
              mixBlendMode: 'screen',
              opacity: chromaIntensity * 0.06,
              background: `radial-gradient(circle at 50% 25%, rgba(239, 68, 68, 0.3), transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        </>
      )}

      {/* ── Screen-wide shockwave at fork moment ──────────────────────── */}
      {(() => {
        const shockwaveStart = FORK_START + 12;
        const shockwaveAge = frame - shockwaveStart;
        const shockwaveDuration = 20;

        if (shockwaveAge < 0 || shockwaveAge > shockwaveDuration) return null;

        // White flash overlay — sharp spike and fast fade
        const flashOpacity = interpolate(shockwaveAge, [0, 2, 8], [0, 0.35, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Three concentric rings with staggered delays (0, 3, 6 frames)
        const rings = [
          { delay: 0, maxRadius: 1200, strokeWidth: 6, color: COLORS.accent.amberBright },
          { delay: 3, maxRadius: 1100, strokeWidth: 4, color: COLORS.accent.amber },
          { delay: 6, maxRadius: 1000, strokeWidth: 3, color: COLORS.accent.amberGlow },
        ];

        return (
          <>
            {/* White flash */}
            {flashOpacity > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#ffffff',
                  opacity: flashOpacity,
                  pointerEvents: 'none',
                  zIndex: 60,
                }}
              />
            )}

            {/* Expanding shockwave rings */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                pointerEvents: 'none',
                zIndex: 55,
              }}
            >
              {rings.map((ring, i) => {
                const ringAge = shockwaveAge - ring.delay;
                if (ringAge < 0) return null;

                const ringExpansion = 15 - ring.delay; // each ring's expansion duration
                const ringRadius = interpolate(ringAge, [0, ringExpansion], [20, ring.maxRadius], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.cubic),
                });
                const ringOpacity = interpolate(ringAge, [0, 2, ringExpansion * 0.6, ringExpansion], [0, 0.8, 0.3, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const ringStroke = interpolate(ringAge, [0, ringExpansion], [ring.strokeWidth * 3, ring.strokeWidth * 0.5], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

                return (
                  <circle
                    key={`shockwave-ring-${i}`}
                    cx={forkCenterX}
                    cy={forkSplitY}
                    r={ringRadius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ringStroke}
                    opacity={ringOpacity}
                    style={{ filter: `blur(${1 + i * 0.5}px)` }}
                  />
                );
              })}
            </svg>
          </>
        );
      })()}

      {/* Main content container with shake + pushback */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shake.x}px, ${shake.y}px) scale(${pushbackScale})`,
        }}
      >
        {/* ── "Make it real." message ──────────────────────────────────── */}
        {frame < FORK_START + 25 && (
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity: makeRealOpacity * makeRealFade,
              transform: `scale(${makeRealScale}) translateY(${makeRealLift}px)`,
            }}
          >
            <div
              style={{
                padding: '16px 40px',
                borderRadius: 12,
                backgroundColor: `rgba(30, 41, 59, 0.8)`,
                border: `1px solid ${COLORS.accent.amber}40`,
                boxShadow: `0 0 ${glowRadius}px ${COLORS.accent.amberGlow}, 0 0 ${glowRadius * 2}px rgba(217, 119, 6, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)`,
              }}
            >
              <span
                style={{
                  color: COLORS.text.primary,
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: FONT.heading,
                  letterSpacing: -0.5,
                  textShadow: `0 0 20px ${COLORS.accent.amberGlow}`,
                }}
              >
                Make it real.
              </span>
            </div>
          </div>
        )}

        {/* ── SVG Y-Fork ──────────────────────────────────────────────── */}
        {forkAge > 0 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1920,
              height: 1080,
              pointerEvents: 'none',
              opacity: forkFade,
            }}
          >
            {/* Stem */}
            <line
              x1={forkCenterX}
              y1={forkTopY}
              x2={forkCenterX}
              y2={forkSplitY}
              stroke={COLORS.accent.amber}
              strokeWidth={3}
              strokeDasharray={stemLength}
              strokeDashoffset={stemLength * (1 - stemProgress)}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${COLORS.accent.amberGlow})` }}
            />

            {/* Three branches */}
            {[branch1Progress, branch2Progress, branch3Progress].map((progress, i) => (
              <path
                key={i}
                d={branchPaths[i]}
                stroke={BRANCHES[i].color}
                strokeWidth={2.5}
                fill="none"
                strokeDasharray={branchLengths[i]}
                strokeDashoffset={branchLengths[i] * (1 - progress)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${BRANCHES[i].color}60)` }}
              />
            ))}

            {/* Fork split point dot */}
            {stemProgress > 0.8 && (
              <circle
                cx={forkCenterX}
                cy={forkSplitY}
                r={5}
                fill={COLORS.accent.amber}
                style={{ filter: `drop-shadow(0 0 10px ${COLORS.accent.amber})` }}
              />
            )}

            {/* Ripple burst from fork point — dual rings */}
            {rippleAge > 0 && rippleAge < 30 && (
              <>
                <circle
                  cx={forkCenterX}
                  cy={forkSplitY}
                  r={rippleRadius}
                  fill="none"
                  stroke={COLORS.accent.amberLight}
                  strokeWidth={2.5}
                  opacity={rippleOpacity}
                />
                {/* Secondary outer ring */}
                <circle
                  cx={forkCenterX}
                  cy={forkSplitY}
                  r={rippleRadius * 1.4}
                  fill="none"
                  stroke={COLORS.accent.amber}
                  strokeWidth={1.5}
                  opacity={rippleOpacity * 0.5}
                />
              </>
            )}
          </svg>
        )}

        {/* ── Debris particles from fork point ───────────────────────── */}
        {forkAge > 10 && forkAge < 50 && DEBRIS_PARTICLES.map((p, i) => {
          const debrisAge = forkAge - 10;
          const debrisDecay = interpolate(debrisAge, [0, 40], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const dist = p.speed * debrisAge;
          const dx = Math.cos(p.angle) * dist;
          const dy = Math.sin(p.angle) * dist - debrisAge * 0.3; // slight upward drift
          const debrisColors = [COLORS.accent.amber, '#3b82f6', '#22c55e'];
          const debrisColor = debrisColors[p.hue];
          const debrisScale = interpolate(debrisAge, [0, 5, 40], [0, 1, 0.3], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // Motion blur streak angle (direction of travel)
          const streakAngleDeg = (p.angle * 180) / Math.PI;
          const streakLength = Math.min(p.speed * 8, 30);

          return (
            <div
              key={`debris-${i}`}
              style={{
                position: 'absolute',
                left: forkCenterX + dx,
                top: forkSplitY + dy,
                width: p.size,
                height: streakLength,
                borderRadius: p.size / 2,
                background: `linear-gradient(180deg, ${debrisColor} 0%, ${debrisColor}40 60%, transparent 100%)`,
                transform: `translate(-50%, -50%) scale(${debrisScale}) rotate(${streakAngleDeg + 90}deg)`,
                opacity: debrisDecay * 0.8,
                boxShadow: `0 0 ${p.size * 3}px ${debrisColor}80`,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* ── Large amber shards flying past camera (3D-like) ────────── */}
        {forkAge > 12 && forkAge < 35 && [
          { x: -300, y: -150, rot: 25, size: 60, delay: 0 },
          { x: 400, y: 100, rot: -35, size: 45, delay: 3 },
          { x: -100, y: 200, rot: 15, size: 50, delay: 6 },
        ].map((shard, i) => {
          const shardAge = forkAge - 12 - shard.delay;
          if (shardAge < 0) return null;
          const shardOpacity = interpolate(shardAge, [0, 3, 8, 18], [0, 0.6, 0.3, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const shardScale = interpolate(shardAge, [0, 5, 18], [0.2, 1.5, 3], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const shardX = forkCenterX + shard.x + shardAge * shard.x * 0.08;
          const shardY = forkSplitY + shard.y + shardAge * shard.y * 0.08;

          return (
            <div
              key={`shard-${i}`}
              style={{
                position: 'absolute',
                left: shardX,
                top: shardY,
                width: shard.size,
                height: shard.size * 0.3,
                backgroundColor: COLORS.accent.amber,
                borderRadius: 2,
                transform: `translate(-50%, -50%) rotate(${shard.rot}deg) scale(${shardScale})`,
                opacity: shardOpacity,
                filter: `blur(${shardScale * 2}px)`,
                boxShadow: `0 0 ${shard.size}px ${COLORS.accent.amberGlow}`,
                pointerEvents: 'none',
                zIndex: 30,
              }}
            />
          );
        })}

        {/* ── Branch labels ───────────────────────────────────────────── */}
        {BRANCHES.map((branch, i) => {
          const entry = labelEntries[i];
          if (frame < entry.delay) return null;

          return (
            <div
              key={branch.name}
              style={{
                position: 'absolute',
                top: branchEndY + 8,
                left: branchEndpoints[i].x - 100,
                width: 200,
                display: 'flex',
                justifyContent: 'center',
                opacity: entry.opacity * forkFade,
                transform: `scale(${entry.scale})`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: `${branch.color}15`,
                  border: `1px solid ${branch.color}40`,
                }}
              >
                {/* Git branch icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="6" y1="3" x2="6" y2="15" stroke={branch.color} strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="6" r="3" stroke={branch.color} strokeWidth="2" fill="none" />
                  <circle cx="6" cy="18" r="3" stroke={branch.color} strokeWidth="2" fill="none" />
                  <path d="M18 9a9 9 0 0 1-9 9" stroke={branch.color} strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                <span
                  style={{
                    color: branch.color,
                    fontSize: 12,
                    fontFamily: FONT.mono,
                    fontWeight: 600,
                  }}
                >
                  {branch.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Progress Tracks ─────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 350,
            left: 160,
            right: 160,
            display: 'flex',
            flexDirection: 'column',
            gap: 80,
          }}
        >
          {BRANCHES.map((branch) => (
            <ProgressTrack
              key={branch.name}
              branchName={branch.name}
              steps={[...STEPS]}
              color={branch.color}
              delay={branch.delay}
              completionFrame={branch.completionFrame}
            />
          ))}
        </div>

        {/* ── PR Badges ───────────────────────────────────────────────── */}
        {frame >= PR_SECTION && (
          <div
            style={{
              position: 'absolute',
              top: badgeStartY,
              left: badgeCenterX - 160,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transform: `scale(${badgePulsePhase})`,
            }}
          >
            {PR_BADGES.map((pr) => (
              <ResultBadge
                key={pr.label}
                icon="↗"
                label={`${pr.label} Opened`}
                sublabel="Ready for review"
                delay={pr.delay}
                color={pr.color}
              />
            ))}
          </div>
        )}

        {/* ── Connection lines from badges to thread indicator ────────── */}
        {frame >= PR_SECTION && (
          <>
            {/* Thread indicator on left */}
            {frame >= 560 && (() => {
              const threadEnter = spring({
                frame: Math.max(0, frame - 560),
                fps,
                config: SPRING_CONFIG.gentle,
              });
              const threadOpacity = interpolate(threadEnter, [0, 0.5, 1], [0, 0.8, 0.8], {
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  style={{
                    position: 'absolute',
                    top: threadIndicatorY - 30,
                    left: threadIndicatorX - 60,
                    opacity: threadOpacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {/* Thread icon */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke={COLORS.accent.amber}
                      strokeWidth="1.5"
                      fill={`${COLORS.accent.amber}15`}
                    />
                  </svg>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: 10,
                      fontFamily: FONT.mono,
                      letterSpacing: 0.5,
                    }}
                  >
                    #thread
                  </span>
                </div>
              );
            })()}

            {/* Dotted lines from PR badges back to thread */}
            {PR_BADGES.map((pr, i) => (
              <ConnectionLine
                key={pr.label}
                from={{ x: badgeCenterX - 160, y: badgeStartY + i * 86 + 30 }}
                to={{ x: threadIndicatorX, y: threadIndicatorY }}
                delay={pr.delay + 15}
                color={pr.color}
                durationFrames={25}
                dashed={true}
                opacity={0.5}
              />
            ))}
          </>
        )}

        {/* ── Tagline: "3 PRs. 1 conversation." ──────────────────────── */}
        {frame >= taglineDelay && (
          <div
            style={{
              position: 'absolute',
              bottom: 100,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity: taglineOpacity,
              transform: `scale(${taglineScale}) translateY(${taglineY}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span
                style={{
                  color: COLORS.accent.amberBright,
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: FONT.heading,
                  letterSpacing: -0.5,
                  textShadow: `0 0 ${14 * taglineGlow}px ${COLORS.accent.amberGlow}`,
                }}
              >
                3 PRs.
              </span>
              <span
                style={{
                  color: COLORS.text.primary,
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: FONT.heading,
                  letterSpacing: -0.5,
                }}
              >
                1 conversation.
              </span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

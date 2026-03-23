/**
 * @reference-scene MeetTaraScene
 * @origin v5 — extracted to library 2026-03-23
 * @demonstrates 3-phase graph-to-thread morph (flatten → stack → reveal)
 * @dependencies COLORS, FONT, SPRING_CONFIG from theme; MORPH_OVERLAP from durations; InvestigationNode, ConnectionLine from components
 */
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  AbsoluteFill,
} from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';
import { MORPH_OVERLAP } from '../durations';
import { InvestigationNode } from '../components/InvestigationNode';
import { ConnectionLine } from '../components/ConnectionLine';

// Duration: 30.5s = 915 frames @ 30fps
const SCENE_FRAMES = 915;

// Phase boundaries (frame-relative)
const MORPH_IN_END = 30;
const ORBIT_START = 30;
const ORBIT_ICON_STAGGER = 15;
const INVESTIGATION_START = 120;
const INVESTIGATION_END = 240;
const DIAGNOSIS_CARD_START = 240;
const DIAGNOSIS_GLOW_START = 450;
const DIAGNOSIS_GLOW_END = 600;
const HOLD_START = 600;
const EXIT_START = SCENE_FRAMES - MORPH_OVERLAP; // 870

// Layout anchors (1920×1080 canvas)
const CENTER = { x: 960, y: 540 };
const STAR_CENTER = { x: 960, y: 280 };
const ORBIT_RADIUS = 150;

// Investigation graph positions
const NODES = [
  { icon: '📸', label: 'Screenshot', x: 250, y: 450, delay: 120, color: COLORS.accent.amber },
  { icon: '💻', label: 'Codebase ×3', x: 550, y: 450, delay: 150, color: COLORS.accent.amber },
  { icon: '🎫', label: 'JIRA', x: 850, y: 450, delay: 180, color: COLORS.tools.jira },
  { icon: '🎯', label: 'Root Cause', x: 1150, y: 450, delay: 210, color: COLORS.accent.amberBright },
] as const;

// Connection lines between adjacent nodes
const CONNECTIONS = [
  { from: { x: 250, y: 450 }, to: { x: 550, y: 450 }, delay: 140 },
  { from: { x: 550, y: 450 }, to: { x: 850, y: 450 }, delay: 170 },
  { from: { x: 850, y: 450 }, to: { x: 1150, y: 450 }, delay: 200 },
] as const;

// Orbit icons with their labels
const ORBIT_ICONS = [
  { emoji: '📸', label: 'screenshot' },
  { emoji: '</>', label: 'code' },
  { emoji: '🎫', label: 'ticket' },
  { emoji: '◆', label: 'Figma' },
  { emoji: '📊', label: 'spreadsheet' },
] as const;

/**
 * MeetTaraScene — Tara is introduced.
 *
 * Star births from center (morph-in from HookScene implosion) →
 * orbit icons appear → investigation pipeline builds →
 * diagnosis card reveals → "Not a suggestion. A diagnosis." moment →
 * hold with ambient breathing → exit morph (nodes collapse downward).
 */
export const MeetTaraScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Morph-in: star birth from center ──────────────────────────────────
  const starBirthSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIG.starBirth,
  });
  const starScale = interpolate(starBirthSpring, [0, 1], [0, 1]);
  const starOpacity = interpolate(starBirthSpring, [0, 0.2, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });

  // Birth flash (bright amber, fades over 10 frames)
  const birthFlashOpacity = interpolate(frame, [0, 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Expanding ripple circle
  const rippleRadius = interpolate(frame, [0, 40], [0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rippleOpacity = interpolate(frame, [0, 10, 40], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ─── Ambient star breathing (continuous after birth) ──────────────────
  const starBreathe = frame > MORPH_IN_END
    ? 1 + 0.03 * Math.sin((frame - MORPH_IN_END) * 0.04)
    : 1;
  const starGlow = frame > MORPH_IN_END
    ? interpolate(
        Math.sin((frame - MORPH_IN_END) * 0.05),
        [-1, 1],
        [0.4, 0.8],
      )
    : 0.6;

  // ─── Star fades up during investigation (stops being center-stage) ────
  const starFadeForInvestigation = interpolate(
    frame,
    [INVESTIGATION_START, INVESTIGATION_START + 60],
    [1, 0.5],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ─── Orbit icons ─────────────────────────────────────────────────────
  const orbitIcons = ORBIT_ICONS.map((icon, i) => {
    const iconDelay = ORBIT_START + i * ORBIT_ICON_STAGGER;
    const iconOpacity = interpolate(frame, [iconDelay, iconDelay + 15], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Fade out orbit icons as investigation builds
    const iconFadeOut = interpolate(
      frame,
      [INVESTIGATION_START, INVESTIGATION_START + 40],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    // Orbit angle: steady rotation + offset per icon
    const baseAngle = (i / ORBIT_ICONS.length) * Math.PI * 2;
    const rotationSpeed = 0.012;
    const angle = baseAngle + (frame - ORBIT_START) * rotationSpeed;

    const orbitX = STAR_CENTER.x + Math.cos(angle) * ORBIT_RADIUS;
    const orbitY = STAR_CENTER.y + Math.sin(angle) * ORBIT_RADIUS * 0.6; // elliptical

    return {
      ...icon,
      x: orbitX,
      y: orbitY,
      opacity: iconOpacity * iconFadeOut,
      delay: iconDelay,
    };
  });

  // ─── Root cause pulse (after all nodes appear) ────────────────────────
  const rootCausePulse =
    frame >= 210 + 40
      ? 1 + 0.08 * Math.sin((frame - 250) * 0.1)
      : 1;
  const rootCauseGlow =
    frame >= 210 + 40
      ? interpolate(
          Math.sin((frame - 250) * 0.1),
          [-1, 1],
          [0.3, 1],
        )
      : 0;

  // ─── Diagnosis card ──────────────────────────────────────────────────
  const diagSpring = spring({
    frame: Math.max(0, frame - DIAGNOSIS_CARD_START),
    fps,
    config: SPRING_CONFIG.smooth,
  });
  const diagVisible = frame >= DIAGNOSIS_CARD_START;
  const diagOpacity = interpolate(diagSpring, [0, 0.3, 1], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });
  const diagTranslateY = interpolate(diagSpring, [0, 1], [30, 0]);

  // Diagnosis glow moment ("Not a suggestion. A diagnosis.")
  const diagGlowRaw = interpolate(
    frame,
    [DIAGNOSIS_GLOW_START, DIAGNOSIS_GLOW_START + 30, DIAGNOSIS_GLOW_END],
    [0, 1, 0.5],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ─── Hold phase ambient pulse ────────────────────────────────────────
  const holdPulse =
    frame >= HOLD_START
      ? 1 + 0.02 * Math.sin((frame - HOLD_START) * 0.03)
      : 1;

  // ─── Exit morph: Thread-line wipe — vertical line draws down, wiping graph ──
  const exitProgress = interpolate(
    frame,
    [EXIT_START, SCENE_FRAMES],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const exitEased = Easing.in(Easing.quad)(exitProgress);

  // ── Phase 1 (exitEased 0–0.3): Flatten — nodes morph from circles to rects ──
  const flattenPhase = interpolate(exitEased, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // ── Phase 2 (exitEased 0.3–0.7): Stack — rects slide to center & stack ──
  const stackPhase = interpolate(exitEased, [0.3, 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // ── Phase 3 (exitEased 0.7–1.0): Mask-reveal — highlight & darken ──
  const revealPhase = interpolate(exitEased, [0.7, 1.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Original investigation nodes fade out quickly during phase 1
  const exitOriginalNodesOpacity = interpolate(exitEased, [0, 0.2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Morph shapes appear as original nodes fade
  const morphShapesOpacity = interpolate(exitEased, [0, 0.1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Per-node morph geometry
  const MORPH_NODE_SIZE = 60; // initial circular size matching InvestigationNode
  const MORPH_TARGET_W = 400;
  const MORPH_TARGET_H = 40;
  const STACK_CENTER_X = 960;
  const STACK_BASE_Y = 300;
  const STACK_GAP = 52;

  const morphNodes = NODES.map((node, i) => {
    // Phase 1: flatten circle → rectangle
    const width = interpolate(flattenPhase, [0, 1], [MORPH_NODE_SIZE, MORPH_TARGET_W]);
    const height = interpolate(flattenPhase, [0, 1], [MORPH_NODE_SIZE, MORPH_TARGET_H]);
    const borderRadius = interpolate(flattenPhase, [0, 1], [MORPH_NODE_SIZE / 2, 8]);

    // Phase 2: slide to center stack
    const targetY = STACK_BASE_Y + i * STACK_GAP;
    const x = interpolate(stackPhase, [0, 1], [node.x, STACK_CENTER_X]);
    const y = interpolate(stackPhase, [0, 1], [node.y, targetY]);

    // Phase 3: border highlight & background shift
    const borderOpacity = interpolate(revealPhase, [0, 0.5], [0.3, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const bgDarken = interpolate(revealPhase, [0, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return { icon: node.icon, label: node.label, color: node.color, width, height, borderRadius, x, y, borderOpacity, bgDarken };
  });

  // Overall fade for morphing shapes toward CollabScene
  const morphFinalFade = interpolate(revealPhase, [0.6, 1], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Thread line height (draws during stack phase)
  const threadLineDrawPhase = interpolate(exitEased, [0.3, 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const threadLineHeight = interpolate(threadLineDrawPhase, [0, 1], [0, 600]);
  const threadLineOpacityExit = interpolate(revealPhase, [0, 0.5, 1], [1, 0.8, 0.4], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        overflow: 'hidden',
      }}
    >
      {/* ── Radial vignette ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 70% at 50% 40%, transparent 20%, ${COLORS.bg.primary} 100%)`,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* ── Birth flash ─────────────────────────────────────────────── */}
      {frame < 12 && (
        <div
          style={{
            position: 'absolute',
            left: STAR_CENTER.x,
            top: STAR_CENTER.y,
            width: 300,
            height: 300,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.accent.amberBright} 0%, ${COLORS.accent.amber}80 30%, transparent 70%)`,
            opacity: birthFlashOpacity,
            pointerEvents: 'none',
            zIndex: 30,
          }}
        />
      )}

      {/* ── Expanding ripple ────────────────────────────────────────── */}
      {frame < 42 && (
        <div
          style={{
            position: 'absolute',
            left: STAR_CENTER.x,
            top: STAR_CENTER.y,
            width: rippleRadius * 2,
            height: rippleRadius * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px solid ${COLORS.accent.amber}`,
            opacity: rippleOpacity,
            pointerEvents: 'none',
            zIndex: 25,
          }}
        />
      )}

      {/* ── Tara star (amber) ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: STAR_CENTER.x,
          top: STAR_CENTER.y,
          transform: `translate(-50%, -50%) scale(${starScale * starBreathe * holdPulse * starFadeForInvestigation})`,
          opacity: starOpacity,
          zIndex: 20,
        }}
      >
        {/* Star SVG — 4-point star */}
        <svg
          width="90"
          height="90"
          viewBox="0 0 90 90"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 ${30 * starGlow}px ${COLORS.accent.amber}) drop-shadow(0 0 ${60 * starGlow}px ${COLORS.accent.amberGlow})`,
          }}
        >
          <path
            d="M45 5 L52 35 L85 45 L52 55 L45 85 L38 55 L5 45 L38 35 Z"
            fill={COLORS.accent.amberBright}
            stroke={COLORS.accent.amber}
            strokeWidth="1.5"
          />
          <circle cx="45" cy="45" r="12" fill={COLORS.accent.amber} opacity="0.8" />
        </svg>
        {/* "Tara" label */}
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: FONT.heading,
              color: COLORS.accent.amberBright,
              letterSpacing: 6,
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${COLORS.accent.amberGlow}`,
            }}
          >
            TARA
          </span>
        </div>
      </div>

      {/* ── Orbit icons ─────────────────────────────────────────────── */}
      {orbitIcons.map((icon, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: icon.x,
            top: icon.y,
            transform: 'translate(-50%, -50%)',
            opacity: icon.opacity,
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: `${COLORS.bg.secondary}`,
              border: `1px solid ${COLORS.accent.amber}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.4), 0 0 16px ${COLORS.accent.amberGlow}`,
            }}
          >
            <span
              style={{
                fontSize: icon.emoji === '</>' ? 12 : 18,
                fontFamily: icon.emoji === '</>' ? FONT.mono : undefined,
                color: icon.emoji === '</>' ? COLORS.accent.amberLight : undefined,
                fontWeight: icon.emoji === '</>' ? 700 : undefined,
              }}
            >
              {icon.emoji}
            </span>
          </div>
        </div>
      ))}

      {/* ── Investigation node pipeline ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: frame >= EXIT_START ? exitOriginalNodesOpacity : 1,
          transformOrigin: '50% 70%',
          zIndex: 10,
        }}
      >
        {/* Connection lines (drawn between node centers) */}
        {CONNECTIONS.map((conn, i) => (
          <ConnectionLine
            key={`conn-${i}`}
            from={conn.from}
            to={conn.to}
            delay={conn.delay}
            color={i === 2 ? COLORS.accent.amberBright : COLORS.accent.amber}
            durationFrames={20}
            strokeWidth={2}
          />
        ))}

        {/* Investigation nodes */}
        {NODES.map((node, i) => (
          <div
            key={`node-${i}`}
            style={{
              // Root cause node has extra pulsing scale
              transform:
                i === NODES.length - 1 && frame >= node.delay + 40
                  ? `scale(${rootCausePulse})`
                  : undefined,
              transformOrigin: `${node.x}px ${node.y}px`,
            }}
          >
            <InvestigationNode
              icon={node.icon}
              label={node.label}
              x={node.x}
              y={node.y}
              delay={node.delay}
              color={node.color}
            />
            {/* Extra glow ring for root cause */}
            {i === NODES.length - 1 && frame >= node.delay + 40 && (
              <div
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: `2px solid ${COLORS.accent.amberBright}`,
                  opacity: rootCauseGlow * 0.5,
                  boxShadow: `0 0 20px ${COLORS.accent.amberBright}30, inset 0 0 12px ${COLORS.accent.amberBright}15`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Exit morph: nodes fold into thread message containers ───── */}
      {frame >= EXIT_START && morphNodes.map((mn, i) => {
        // Background transitions from node color to dark card color
        const bgColor = interpolate(mn.bgDarken, [0, 1], [0, 1]);
        const bgR = Math.round(interpolate(bgColor, [0, 1], [30, 22]));
        const bgG = Math.round(interpolate(bgColor, [0, 1], [41, 30]));
        const bgB = Math.round(interpolate(bgColor, [0, 1], [59, 45]));

        return (
          <div
            key={`morph-node-${i}`}
            style={{
              position: 'absolute',
              left: mn.x,
              top: mn.y,
              width: mn.width,
              height: mn.height,
              borderRadius: mn.borderRadius,
              transform: 'translate(-50%, -50%)',
              backgroundColor: `rgb(${bgR}, ${bgG}, ${bgB})`,
              border: `1.5px solid ${mn.color}${Math.round(mn.borderOpacity * 255).toString(16).padStart(2, '0')}`,
              opacity: morphShapesOpacity * morphFinalFade,
              zIndex: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingLeft: interpolate(flattenPhase, [0, 1], [0, 16]),
              paddingRight: interpolate(flattenPhase, [0, 1], [0, 16]),
              gap: 8,
              overflow: 'hidden',
              boxShadow: revealPhase > 0
                ? `0 2px 12px rgba(0, 0, 0, ${interpolate(revealPhase, [0, 1], [0.2, 0.5])}), 0 0 ${interpolate(revealPhase, [0, 1], [0, 16])}px ${COLORS.accent.amberGlow}`
                : `0 2px 8px rgba(0, 0, 0, 0.3)`,
            }}
          >
            {/* Icon — fades in as shape flattens */}
            <span
              style={{
                fontSize: interpolate(flattenPhase, [0, 1], [18, 14]),
                opacity: interpolate(flattenPhase, [0.4, 1], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                flexShrink: 0,
              }}
            >
              {mn.icon}
            </span>
            {/* Label — fades in as shape flattens */}
            <span
              style={{
                fontSize: 13,
                fontFamily: FONT.body,
                fontWeight: 600,
                color: COLORS.text.primary,
                opacity: interpolate(flattenPhase, [0.5, 1], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                whiteSpace: 'nowrap',
              }}
            >
              {mn.label}
            </span>
          </div>
        );
      })}

      {/* ── Thread-line wipe (exit morph: draws down from diagnosis) ─ */}
      {frame >= EXIT_START && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 580,
            width: 2,
            height: threadLineHeight,
            background: `linear-gradient(180deg, ${COLORS.accent.amber}80 0%, ${COLORS.accent.amber}40 60%, transparent 100%)`,
            transform: 'translateX(-50%)',
            opacity: threadLineOpacityExit,
            zIndex: 15,
            boxShadow: `0 0 8px ${COLORS.accent.amberGlow}`,
            borderRadius: 1,
          }}
        />
      )}

      {/* ── Diagnosis card ──────────────────────────────────────────── */}
      {diagVisible && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 580,
            transform: `translateX(-50%) translateY(${diagTranslateY}px) ${frame >= EXIT_START ? `translateY(${interpolate(exitEased, [0, 0.3], [0, -40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)` : ''}`,
            opacity: diagOpacity * (frame >= EXIT_START ? interpolate(exitEased, [0, 0.4, 0.7], [1, 0.5, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1),
            zIndex: 12,
            width: 720,
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.bg.secondary,
              border: `1px solid ${COLORS.accent.amber}60`,
              borderRadius: 12,
              padding: '28px 32px',
              boxShadow: `
                0 8px 40px rgba(0, 0, 0, 0.5),
                0 0 ${40 * diagGlowRaw}px ${COLORS.accent.amberGlow},
                inset 0 1px 0 rgba(255, 255, 255, 0.04)
              `,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLORS.accent.amberBright,
                  boxShadow: `0 0 8px ${COLORS.accent.amber}`,
                }}
              />
              <span
                style={{
                  color: COLORS.accent.amberBright,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: FONT.heading,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                Diagnosis
              </span>
            </div>

            {/* File path */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 14 }}>📄</span>
              <span
                style={{
                  color: COLORS.text.secondary,
                  fontSize: 13,
                  fontFamily: FONT.mono,
                }}
              >
                src/routes/checkout/+page.svelte:849
              </span>
            </div>

            {/* Root cause */}
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  color: COLORS.text.dim,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: FONT.body,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Root Cause
              </span>
              <p
                style={{
                  color: COLORS.text.primary,
                  fontSize: 15,
                  fontFamily: FONT.body,
                  lineHeight: 1.6,
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                Hardcoded string &ldquo;Procced to Payment&rdquo; in checkout button label.
                Introduced in commit <span style={{ fontFamily: FONT.mono, color: COLORS.accent.amberLight }}>a3f8e21</span>.
              </p>
            </div>

            {/* Proposed fix */}
            <div>
              <span
                style={{
                  color: COLORS.text.dim,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: FONT.body,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Proposed Fix
              </span>
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 14px',
                  backgroundColor: `${COLORS.bg.primary}`,
                  borderRadius: 8,
                  border: `1px solid ${COLORS.bg.surface}`,
                }}
              >
                <code
                  style={{
                    color: '#22c55e',
                    fontSize: 13,
                    fontFamily: FONT.mono,
                    lineHeight: 1.6,
                  }}
                >
                  - &quot;Procced to Payment&quot;
                  <br />
                  + &quot;Proceed to Payment&quot;
                </code>
              </div>
            </div>

            {/* Scan-line reveal effect on diagnosis card */}
            {frame >= DIAGNOSIS_CARD_START && frame < DIAGNOSIS_CARD_START + 60 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 12,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    top: `${interpolate(frame, [DIAGNOSIS_CARD_START, DIAGNOSIS_CARD_START + 50], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`,
                    background: `linear-gradient(90deg, transparent 0%, ${COLORS.accent.amber}60 30%, ${COLORS.accent.amberBright} 50%, ${COLORS.accent.amber}60 70%, transparent 100%)`,
                    boxShadow: `0 0 12px ${COLORS.accent.amberGlow}, 0 0 4px ${COLORS.accent.amber}`,
                    opacity: interpolate(frame, [DIAGNOSIS_CARD_START, DIAGNOSIS_CARD_START + 10, DIAGNOSIS_CARD_START + 45, DIAGNOSIS_CARD_START + 55], [0, 0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  }}
                />
              </div>
            )}

            {/* "Not a suggestion" text — appears at DIAGNOSIS_GLOW_START */}
            {frame >= DIAGNOSIS_GLOW_START && (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${COLORS.bg.surface}`,
                  opacity: interpolate(
                    frame,
                    [DIAGNOSIS_GLOW_START, DIAGNOSIS_GLOW_START + 20],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                  ),
                }}
              >
                <span
                  style={{
                    color: COLORS.accent.amberBright,
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: FONT.heading,
                    fontStyle: 'italic',
                    textShadow: `0 0 ${14 * diagGlowRaw}px ${COLORS.accent.amberGlow}`,
                  }}
                >
                  Not a suggestion. A diagnosis.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

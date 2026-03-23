/**
 * @reference-scene DiscussionScene
 * @origin v2 — extracted to library 2026-03-23
 * @demonstrates Fork animation + SVG cubic bezier + particle trails + aftershock system
 * @dependencies COLORS, FONT, SPRING_CONFIG from theme; SlackMessage, PlanCard from components
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT, SPRING_CONFIG } from '../theme';
import { SlackMessage } from '../components/SlackMessage';
import { PlanCard } from '../components/PlanCard';

// ---------------------------------------------------------------------------
// Data: Thread messages
// ---------------------------------------------------------------------------
// Scene 3 is 1325 frames (44.18s). VO phases:
//   0-450 (~0-15s): "Now the team weighs in..." — messages appear, plan updates
//   450-750 (~15-25s): "This is the creative part..." — reflective beat, content holds
//   750-1325 (~25-44s): "And when the plan is ready... it splits" — fork animation
// Iteration 20: Non-uniform stagger delays — mimic natural conversation rhythm
// Short gaps for quick replies, longer pauses for thoughtful responses
const MESSAGES = [
  {
    name: 'Sarah',
    avatarColor: COLORS.roles.pm,
    text: 'We should handle the mobile viewport too.',
    timestamp: '9:15 AM',
    delay: 25,
  },
  {
    name: 'Alex',
    avatarColor: COLORS.roles.devLead,
    text: 'Agreed. Also add rate limiting on the API.',
    timestamp: '9:42 AM',
    delay: 105,  // shorter gap — quick agreement
  },
  {
    name: 'Jordan',
    avatarColor: COLORS.roles.security,
    text: 'Use JWT refresh tokens, not just access tokens.',
    timestamp: '10:30 AM',
    delay: 230,  // longer gap — thoughtful security input
  },
  {
    name: 'Tara',
    avatarColor: COLORS.roles.tara,
    text: 'Plan updated with auth and rate limiting. Ready for review.',
    timestamp: '10:31 AM',
    delay: 290,  // quick Tara response
  },
  {
    name: 'Morgan',
    avatarColor: COLORS.roles.qa,
    text: 'What about session expiry mid-checkout?',
    timestamp: '2:00 PM',
    delay: 410,  // longer gap — new concern raised
  },
  {
    name: 'Tara',
    avatarColor: COLORS.roles.tara,
    text: 'Edge case covered. Plan finalized.',
    timestamp: '2:01 PM',
    delay: 490,  // quick Tara resolution
  },
];

// ---------------------------------------------------------------------------
// Data: Plan items (evolving over time)
// ---------------------------------------------------------------------------
const buildPlanItems = (frame: number) => {
  const items = [
    {
      text: 'Fix checkout CSS overflow',
      checked: frame >= 350,
      addedAt: 20,
      checkedAt: 350,
    },
    {
      text: 'Update billing flow',
      checked: frame >= 380,
      addedAt: 20,
      checkedAt: 380,
    },
    {
      text: 'Add error handling',
      checked: frame >= 400,
      addedAt: 20,
      checkedAt: 400,
    },
    {
      text: 'Rate limiting on checkout API',
      checked: frame >= 450,
      addedAt: 140,
      checkedAt: 450,
    },
    {
      text: 'JWT refresh token auth',
      checked: frame >= 480,
      addedAt: 240,
      checkedAt: 480,
    },
    {
      text: 'Handle session expiry edge case',
      checked: frame >= 580,
      addedAt: 440,
      checkedAt: 580,
    },
  ];
  return items;
};

// ---------------------------------------------------------------------------
// Fork branch config
// ---------------------------------------------------------------------------
interface ForkBranch {
  label: string;
  endX: number;
  endY: number;
  color: string;
  lineDelay: number; // extra frame delay for the line to start drawing
}

const FORK_Y_START = 180;
const FORK_Y_SPLIT = 460;
// Iteration 11: Wider lineDelay stagger for clearly sequential branch drawing
const FORK_BRANCHES: ForkBranch[] = [
  {
    label: 'feature/auth-flow',
    endX: 400,
    endY: 720,
    color: COLORS.roles.devLead,
    lineDelay: 0,
  },
  {
    label: 'feature/rate-limiting',
    endX: 960,
    endY: 720,
    color: COLORS.roles.pm,
    lineDelay: 10,
  },
  {
    label: 'feature/mobile-viewport',
    endX: 1520,
    endY: 720,
    color: COLORS.roles.qa,
    lineDelay: 20,
  },
];

const STEM_X = 960;

// ---------------------------------------------------------------------------
// Sub-components for the fork animation
// ---------------------------------------------------------------------------

/** Glow dot that pulses at a branch endpoint — with flash on first appear */
const GlowDot: React.FC<{
  cx: number;
  cy: number;
  color: string;
  opacity: number;
  frame: number;
  /** Frame at which this dot first becomes visible (for flash calc) */
  appearFrame: number;
}> = ({ cx, cy, color, opacity, frame, appearFrame }) => {
  // Frames since this dot appeared
  const age = Math.max(0, frame - appearFrame);
  // Flash: radius jumps to 20 then settles to 8 over ~18 frames
  const flashRadius = interpolate(age, [0, 4, 18], [20, 16, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Pulse radius around the settled size at ~1.5 Hz
  const pulse = age > 18 ? Math.sin(frame * 0.12) * 2 + 8 : flashRadius;
  // Flash opacity — outer ring is extra bright at first then fades
  const flashGlowOpacity = interpolate(age, [0, 4, 20], [0.6, 0.45, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g style={{ opacity }}>
      {/* Outer glow ring — larger and more visible */}
      <circle
        cx={cx}
        cy={cy}
        r={pulse + 10}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={flashGlowOpacity}
      />
      {/* Inner glow halo */}
      <circle cx={cx} cy={cy} r={pulse + 3} fill={color} opacity={0.2} />
      {/* Solid core */}
      <circle cx={cx} cy={cy} r={6} fill={color} />
    </g>
  );
};

/** Monospace pill label for a branch — slides in from horizontal direction */
const BranchLabel: React.FC<{
  x: number;
  y: number;
  label: string;
  color: string;
  opacity: number;
  /** Horizontal slide offset (negative = from left, positive = from right, 0 = center) */
  slideFrom: number;
  /** Spring progress 0→1 for the slide animation */
  slideProgress: number;
}> = ({ x, y, label, color, opacity, slideFrom, slideProgress }) => {
  const pillW = label.length * 10.5 + 28;
  const pillH = 34;
  const translateX = interpolate(slideProgress, [0, 1], [slideFrom, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g style={{ opacity }} transform={`translate(${translateX}, 0)`}>
      {/* Background pill */}
      <rect
        x={x - pillW / 2}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={color}
      />
      {/* Label text */}
      <text
        x={x}
        y={y + 1}
        fill="#ffffff"
        fontSize={14}
        fontFamily={FONT.mono}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Build an SVG cubic-bezier path from the split point to a branch endpoint
// ---------------------------------------------------------------------------
function branchPath(branch: ForkBranch): string {
  const sx = STEM_X;
  const sy = FORK_Y_SPLIT;
  const ex = branch.endX;
  const ey = branch.endY;
  // Control points: keep it vertical initially then curve outward
  const cp1x = sx;
  const cp1y = sy + (ey - sy) * 0.55;
  const cp2x = ex;
  const cp2y = sy + (ey - sy) * 0.45;
  return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
}

// Approximate path length for dash animation
function approxLength(branch: ForkBranch): number {
  const dx = branch.endX - STEM_X;
  const dy = branch.endY - FORK_Y_SPLIT;
  // Rough approximation — cubic bezier is ~1.15x the straight line
  return Math.sqrt(dx * dx + dy * dy) * 1.15;
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------
export const DiscussionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene exit — 45 frames (iter 39: tightened from 55 per Gemini feedback)
  const EXIT_FRAMES = 45;
  const exitStart = durationInFrames - EXIT_FRAMES;
  const sceneFadeOut = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const exitScale = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0.7],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  // Iteration 30: Reduced from -60 to -30 for graceful recede
  const exitDriftY = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, -30],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const exitBlur = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Phase detection — fork starts at ~26s (frame 780) when VO says "it splits"
  const FORK_START = 780;
  const isForkPhase = frame >= FORK_START;

  // Iteration 31: Thread dims to 10% before fork — nearly clean canvas for hero moment
  const preForkDim = interpolate(frame, [FORK_START - 60, FORK_START - 25], [1, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out thread & plan before fork — thread fully gone by fork start
  const contentOpacity = interpolate(frame, [FORK_START - 25, FORK_START + 5], [preForkDim, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Content also scales down slightly as it fades
  const contentScale = interpolate(frame, [FORK_START - 20, FORK_START + 20], [1.0, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fork fade-in — overlaps with content fade-out for crossfade effect
  const forkOpacity = interpolate(frame, [FORK_START + 5, FORK_START + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Amber connector line — draws across center during transition
  const connectorAppear = FORK_START - 10;
  const connectorDrawDuration = 30;
  const connectorWidth = interpolate(
    frame,
    [connectorAppear, connectorAppear + connectorDrawDuration],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const connectorOpacity = interpolate(
    frame,
    [connectorAppear, connectorAppear + 5, connectorAppear + connectorDrawDuration, connectorAppear + connectorDrawDuration + 15],
    [0, 0.9, 0.9, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ---------- Stem line draw ----------
  // Iteration 45: Extended "breath" before stem to 60 frames — more dramatic tension build
  const STEM_START = FORK_START + 100; // extra 60 frames for breath/tension build (was 80)
  const BRANCH_START = STEM_START + 35; // branches start after stem mostly done
  const stemLength = FORK_Y_SPLIT - FORK_Y_START;
  // Iteration 11: Slower stem draw with more mass for weight, lower stiffness for gradual settle
  const stemDrawProgress = isForkPhase
    ? spring({
        frame: Math.max(0, frame - STEM_START),
        fps,
        config: { damping: 14, stiffness: 60, mass: 1.2 },
      })
    : 0;
  const stemDrawn = stemLength * stemDrawProgress;

  // ---------- Branch lines draw ----------
  // Iteration 18: Whip-like branch draw — fast shoot-out with low damping for energy
  const branchDrawProgressArr = FORK_BRANCHES.map((b) => {
    if (!isForkPhase) return 0;
    return spring({
      frame: Math.max(0, frame - BRANCH_START - b.lineDelay * 2),
      fps,
      config: { damping: 8, stiffness: 220, mass: 0.5 },
    });
  });

  // Branch label fade — each label appears 20 frames after its line starts
  const branchLabelOpacities = FORK_BRANCHES.map((b) => {
    const lineStart = BRANCH_START + b.lineDelay;
    // Label fades in 20 frames after the line drawing starts
    const labelStart = lineStart + 20;
    return interpolate(frame, [labelStart, labelStart + 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  });

  // Branch label slide springs — snappy pop from horizontal directions
  const branchLabelSlideProgress = FORK_BRANCHES.map((b) => {
    const lineStart = BRANCH_START + b.lineDelay;
    const labelStart = lineStart + 20;
    if (!isForkPhase) return 0;
    return spring({
      frame: Math.max(0, frame - labelStart),
      fps,
      config: { damping: 8, stiffness: 160, mass: 0.8 },
    });
  });

  // Slide directions: left branch from left (-80), right from right (+80), center stays (0)
  const branchSlideFromDirections = FORK_BRANCHES.map((b) => {
    if (b.endX < STEM_X - 100) return -80; // left branch
    if (b.endX > STEM_X + 100) return 80; // right branch
    return 0; // center branch
  });

  // Glow dot opacities — appear with the label
  const dotOpacities = branchLabelOpacities;

  // Glow dot appear frames (for flash timing)
  const dotAppearFrames = FORK_BRANCHES.map((b) => {
    const lineStart = BRANCH_START + b.lineDelay;
    return lineStart + 20;
  });

  // ---------- Plan items ----------
  const planItems = buildPlanItems(frame);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        fontFamily: FONT.heading,
        opacity: sceneFadeOut,
        transform: `scale(${exitScale}) translateY(${exitDriftY}px)`,
        filter: `blur(${exitBlur}px)`,
      }}
    >
      {/* ============================================================== */}
      {/* CONVERSATION PHASE (frames 0-440)                              */}
      {/* ============================================================== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: contentOpacity,
          transform: `scale(${contentScale})`,
          display: 'flex',
        }}
      >
        {/* LEFT — Thread messages (55%) */}
        <div
          style={{
            width: '55%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '60px 40px 40px 60px',
            overflowY: 'hidden',
            gap: 4,
          }}
        >
          {/* Thread header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span
              style={{
                color: COLORS.text.secondary,
                fontSize: 13,
                fontFamily: FONT.body,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              # checkout-redesign
            </span>
          </div>

          {/* Messages */}
          {MESSAGES.map((msg, i) => (
            <SlackMessage
              key={i}
              name={msg.name}
              avatarColor={msg.avatarColor}
              text={msg.text}
              timestamp={msg.timestamp}
              delay={msg.delay}
            />
          ))}
        </div>

        {/* DIVIDER (5%) — subtle opacity pulse */}
        <div
          style={{
            width: '5%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 1,
              height: '70%',
              opacity: 0.3 + Math.sin(frame * 0.06) * 0.15,
              background: `linear-gradient(
                180deg,
                transparent 0%,
                ${COLORS.bg.surface} 20%,
                ${COLORS.bg.surface} 80%,
                transparent 100%
              )`,
            }}
          />
        </div>

        {/* RIGHT — Plan card (40%) — subtle float */}
        <div
          style={{
            width: '40%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '60px 40px 40px 0',
            // Iteration 45: Removed floating drift — Gemini says too many competing motions
          }}
        >
          {/* Section label */}
          <div
            style={{
              marginBottom: 16,
              alignSelf: 'flex-start',
              opacity: interpolate(frame, [0, 20], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* Iteration 12: More visible pulsing glow on Live Plan label */}
            <span
              style={{
                color: `rgb(${217 + Math.sin(frame * 0.08) * 30}, ${119 + Math.sin(frame * 0.08) * 25}, 6)`,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: FONT.body,
                letterSpacing: 2,
                textTransform: 'uppercase',
                textShadow: `0 0 ${12 + Math.sin(frame * 0.06) * 8}px rgba(217, 119, 6, ${0.5 + Math.sin(frame * 0.06) * 0.3})`,
                transform: `scale(${1.0 + Math.sin(frame * 0.05) * 0.03})`,
                display: 'inline-block',
              }}
            >
              ● Live Plan
            </span>
          </div>

          <PlanCard title="Sprint Plan — Checkout Redesign" items={planItems} delay={10} />
        </div>
      </div>

      {/* ============================================================== */}
      {/* ITERATION 26: Pre-fork tension glow — builds during the breath */}
      {/* ============================================================== */}
      {frame >= FORK_START && frame < STEM_START && (() => {
        const breathProgress = interpolate(frame, [FORK_START, STEM_START], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const tensionGlow = breathProgress * 0.35;
        const tensionPulse = 1 + Math.sin(breathProgress * Math.PI * 4) * 0.15;
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 43%, rgba(217, 119, 6, ${tensionGlow * tensionPulse}) 0%, transparent 40%)`,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        );
      })()}

      {/* ============================================================== */}
      {/* AMBER CONNECTOR LINE — transition bridge                       */}
      {/* ============================================================== */}
      {connectorOpacity > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${connectorWidth}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${COLORS.accent.amber} 15%, ${COLORS.accent.amber} 85%, transparent 100%)`,
            opacity: connectorOpacity,
            boxShadow: `0 0 12px ${COLORS.accent.amber}, 0 0 4px ${COLORS.accent.amber}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ============================================================== */}
      {/* FORK PHASE (frames 420+)                                       */}
      {/* ============================================================== */}
      {isForkPhase && (() => {
        // Camera zoom-out effect — starts slightly zoomed in (1.08) and settles to 1.0
        const zoomOutSpring = spring({
          frame: Math.max(0, frame - FORK_START),
          fps,
          config: { damping: 18, stiffness: 40, mass: 1.2 },
        });
        const cameraScale = interpolate(zoomOutSpring, [0, 1], [1.08, 1.0]);
        return null; // rendered below
      })()}
      {/* Iteration 29: Smooth push-back instead of sharp jolt — "precise tech event" feel */}
      {isForkPhase && (() => {
        const splitFrame = STEM_START + 25;
        // Iteration 40: Much more aggressive push-back — damping 8, stiffness 250 per Gemini
        const pushBackSpring = spring({
          frame: Math.max(0, frame - splitFrame),
          fps,
          config: { damping: 8, stiffness: 250, mass: 0.7 },
        });
        const pushBackScale = frame >= splitFrame
          ? interpolate(pushBackSpring, [0, 0.3, 1], [0.85, 0.92, 1.0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            })
          : 1.0;
        // Iteration 43: Refined screen shake — 2-frame 2px micro-jolt. Clean and decisive, not chaotic.
        // Push-back + ripple carry the hero weight; shake is just a punctuation mark.
        const shakeAge = Math.max(0, frame - splitFrame);
        const shakeX = shakeAge >= 0 && shakeAge < 2
          ? [2, -1][shakeAge] || 0
          : 0;
        const shakeY = shakeAge >= 0 && shakeAge < 2
          ? [-2, 1][shakeAge] || 0
          : 0;
        return (
        <AbsoluteFill style={{
          opacity: forkOpacity,
          transform: `scale(${interpolate(
            spring({
              frame: Math.max(0, frame - FORK_START),
              fps,
              config: { damping: 18, stiffness: 40, mass: 1.2 },
            }),
            [0, 1],
            [1.08, 1.0]
          ) * pushBackScale}) translate(${shakeX}px, ${shakeY}px)`,
          transformOrigin: `${STEM_X}px ${FORK_Y_SPLIT}px`,
        }}>

          {/* "Parallel work begins" caption — scale spring + amber glow */}
          {(() => {
            // Iteration 33: Moved to AFTER fork completes — directly tied to the visual
            const captionStart = BRANCH_START + 50;
            const captionOpacity = interpolate(frame, [captionStart, captionStart + 20], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const captionScale = isForkPhase
              ? interpolate(
                  spring({
                    frame: Math.max(0, frame - captionStart),
                    fps,
                    config: { damping: 12, stiffness: 200, mass: 0.7 },
                  }),
                  [0, 1],
                  [0.7, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                )
              : 0.7;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 80,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  opacity: captionOpacity,
                  transform: `scale(${captionScale})`,
                }}
              >
                <span
                  style={{
                    color: COLORS.text.primary,
                    fontSize: 34,
                    fontWeight: 700,
                    fontFamily: FONT.heading,
                    letterSpacing: -0.5,
                    textShadow: `0 0 ${30 + Math.sin((frame - FORK_START) * 0.06) * 15}px rgba(217, 119, 6, ${0.4 + Math.sin((frame - FORK_START) * 0.05) * 0.2})`,
                  }}
                >
                  {/* Iteration 43: Faster word-level reveal instead of per-character */}
                  {['Parallel', ' ', 'work', ' ', 'begins'].map((word, wi) => {
                    const wordStart = captionStart + wi * 4;
                    const wordOpacity = interpolate(frame, [wordStart, wordStart + 5], [0, 1], {
                      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                    });
                    return (
                      <span key={wi} style={{ opacity: wordOpacity }}>{word}</span>
                    );
                  })}
                </span>
              </div>
            );
          })()}

          {/* SVG fork diagram */}
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* SVG filter for branch glow */}
            <defs>
              <filter id="branchGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
              </filter>
            </defs>

            {/* ---- Stem line ---- */}
            <line
              x1={STEM_X}
              y1={FORK_Y_START}
              x2={STEM_X}
              y2={FORK_Y_START + stemDrawn}
              stroke={COLORS.text.secondary}
              strokeWidth={4}
              strokeLinecap="round"
            />

            {/* Dot at top of stem */}
            {stemDrawProgress > 0.05 && (
              <circle
                cx={STEM_X}
                cy={FORK_Y_START}
                r={5}
                fill={COLORS.accent.amber}
              />
            )}

            {/* ---- Branch lines ---- */}
            {FORK_BRANCHES.map((branch, i) => {
              const path = branchPath(branch);
              const length = approxLength(branch);
              const drawn = length * branchDrawProgressArr[i];
              const dashOffset = length - drawn;

              return (
                <g key={branch.label}>
                  {/* Faint track (full path, low opacity) */}
                  <path
                    d={path}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={3}
                    opacity={0.1}
                  />

                  {/* Glow trail behind the animated path */}
                  <path
                    d={path}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={length}
                    strokeDashoffset={dashOffset}
                    opacity={0.12}
                    filter="url(#branchGlow)"
                  />

                  {/* Animated drawn path */}
                  <path
                    d={path}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={length}
                    strokeDashoffset={dashOffset}
                  />

                  {/* Iteration 36: Particle trails on fork branches — adds energy/texture */}
                  {branchDrawProgressArr[i] > 0.05 && branchDrawProgressArr[i] < 0.98 && (() => {
                    // Generate 3 trailing particles behind the drawing tip
                    const tipProgress = branchDrawProgressArr[i];
                    return [0, 1, 2].map((pIdx) => {
                      const trailProgress = Math.max(0, tipProgress - pIdx * 0.08);
                      if (trailProgress <= 0) return null;
                      // Compute position along the bezier (approximate with linear interp)
                      const sx = STEM_X;
                      const sy = FORK_Y_SPLIT;
                      const ex = branch.endX;
                      const ey = branch.endY;
                      const t = trailProgress;
                      const px = sx + (ex - sx) * t;
                      const py = sy + (ey - sy) * t;
                      const particleSize = 4 - pIdx * 1;
                      const particleOpacity = (0.7 - pIdx * 0.2) * (1 - tipProgress);
                      return (
                        <circle
                          key={`trail-${i}-${pIdx}`}
                          cx={px}
                          cy={py}
                          r={particleSize}
                          fill={branch.color}
                          opacity={particleOpacity}
                        />
                      );
                    });
                  })()}

                  {/* Glow dot at branch endpoint — with flash */}
                  <GlowDot
                    cx={branch.endX}
                    cy={branch.endY}
                    color={branch.color}
                    opacity={dotOpacities[i]}
                    frame={frame}
                    appearFrame={dotAppearFrames[i]}
                  />

                  {/* Branch label pill — slides from horizontal direction */}
                  <BranchLabel
                    x={branch.endX}
                    y={branch.endY + 50}
                    label={branch.label}
                    color={branch.color}
                    opacity={branchLabelOpacities[i]}
                    slideFrom={branchSlideFromDirections[i]}
                    slideProgress={branchLabelSlideProgress[i]}
                  />
                </g>
              );
            })}

            {/* HERO FORK MOMENT — charge-up glow + explosive ripple burst at split point */}
            {stemDrawProgress > 0.5 && (() => {
              const splitDotOpacity = interpolate(stemDrawProgress, [0.8, 1], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              // Charge-up glow as stem approaches split point (0.5 → 0.95)
              const chargeProgress = interpolate(stemDrawProgress, [0.5, 0.95], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const chargeGlowRadius = interpolate(chargeProgress, [0, 1], [10, 60]);
              const chargeGlowOpacity = interpolate(chargeProgress, [0, 0.5, 0.9, 1], [0, 0.3, 0.7, 0]);
              // Pulsing charge effect
              const chargePulse = Math.sin(chargeProgress * Math.PI * 6) * 0.3 + 0.7;

              // Frames since the split dot appeared
              const splitAppearFrame = STEM_START + 25;
              const splitAge = Math.max(0, frame - splitAppearFrame);

              // Iteration 46: Staggered ripple — delayed 3 frames after flash for cause→effect separation
              // Ring 1: Primary massive ripple (starts 3 frames AFTER flash)
              const ripple1DelayedAge = Math.max(0, splitAge - 3);
              const ripple1Radius = interpolate(ripple1DelayedAge, [0, 35], [8, 650], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              const ripple1Opacity = interpolate(ripple1DelayedAge, [0, 2, 35], [0, 0.9, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });

              // Ring 2: First aftershock — 8 frames delayed (was 5, now +3 for stagger)
              const ripple2Delay = 8;
              const ripple2Age = Math.max(0, splitAge - ripple2Delay);
              const ripple2Radius = interpolate(ripple2Age, [0, 40], [8, 480], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              const ripple2Opacity = interpolate(ripple2Age, [0, 2, 40], [0, 0.5, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });

              // Ring 3: Second aftershock — 15 frames delayed (was 12, now +3 for stagger)
              const ripple3Delay = 15;
              const ripple3Age = Math.max(0, splitAge - ripple3Delay);
              const ripple3Radius = interpolate(ripple3Age, [0, 50], [8, 350], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              const ripple3Opacity = interpolate(ripple3Age, [0, 2, 50], [0, 0.25, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });

              // Iteration 32: Brighter, shorter flash — concentrated energy (30% peak, 4 frames)
              const flashOpacity = interpolate(splitAge, [0, 1, 4, 15], [0, 0.30, 0.18, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });

              return (
                <g>
                  {/* Charge-up glow while stem approaches split point */}
                  {chargeProgress > 0 && chargeProgress < 1 && (
                    <circle
                      cx={STEM_X}
                      cy={FORK_Y_SPLIT}
                      r={chargeGlowRadius * chargePulse}
                      fill={COLORS.accent.amber}
                      opacity={chargeGlowOpacity * chargePulse}
                    />
                  )}
                  {/* Bigger flash at split moment — fills more of the screen */}
                  <circle
                    cx={STEM_X}
                    cy={FORK_Y_SPLIT}
                    r={80}
                    fill={COLORS.accent.amberLight}
                    opacity={flashOpacity}
                  />
                  {/* Secondary wider flash ring */}
                  <circle
                    cx={STEM_X}
                    cy={FORK_Y_SPLIT}
                    r={interpolate(splitAge, [0, 20], [40, 200], { extrapolateRight: 'clamp' })}
                    fill="none"
                    stroke={COLORS.accent.amber}
                    strokeWidth={4}
                    opacity={interpolate(splitAge, [0, 3, 20], [0, 0.7, 0], { extrapolateRight: 'clamp' })}
                  />
                  {/* First expanding ripple ring — massive */}
                  <circle
                    cx={STEM_X}
                    cy={FORK_Y_SPLIT}
                    r={ripple1Radius}
                    fill="none"
                    stroke={COLORS.accent.amber}
                    strokeWidth={4}
                    opacity={ripple1Opacity}
                  />
                  {/* Second aftershock ripple */}
                  {ripple2Opacity > 0.01 && (
                    <circle
                      cx={STEM_X}
                      cy={FORK_Y_SPLIT}
                      r={ripple2Radius}
                      fill="none"
                      stroke={COLORS.accent.amber}
                      strokeWidth={2.5}
                      opacity={ripple2Opacity}
                    />
                  )}
                  {/* Iteration 41: Third aftershock — slowest, faintest, adds resonance */}
                  {ripple3Opacity > 0.01 && (
                    <circle
                      cx={STEM_X}
                      cy={FORK_Y_SPLIT}
                      r={ripple3Radius}
                      fill="none"
                      stroke={COLORS.accent.amber}
                      strokeWidth={1.5}
                      opacity={ripple3Opacity}
                    />
                  )}
                  {/* Iteration 32: Simplified — powerful ripple + aftershock + brief full-screen flash.
                      Concentrated energy rather than multiple competing effects. */}
                  {splitAge >= 0 && splitAge < 5 && (
                    <rect
                      x={0} y={0} width={1920} height={1080}
                      fill={COLORS.accent.amberLight}
                      opacity={interpolate(splitAge, [0, 1, 5], [0, 0.2, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
                    />
                  )}
                  {/* Solid split dot — larger */}
                  <circle
                    cx={STEM_X}
                    cy={FORK_Y_SPLIT}
                    r={8}
                    fill={COLORS.accent.amber}
                    opacity={splitDotOpacity}
                  />
                  {/* Outer glow ring on split dot */}
                  <circle
                    cx={STEM_X}
                    cy={FORK_Y_SPLIT}
                    r={14}
                    fill="none"
                    stroke={COLORS.accent.amber}
                    strokeWidth={2}
                    opacity={splitDotOpacity * 0.5}
                  />
                </g>
              );
            })()}
          </svg>

          {/* Subtitle under diagram — fades in with gentle upward slide */}
          {(() => {
            const subtitleOpacity = interpolate(frame, [BRANCH_START + 60, BRANCH_START + 90], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const subtitleY = interpolate(frame, [BRANCH_START + 60, BRANCH_START + 90], [10, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                style={{
                  position: 'absolute',
                  bottom: 100,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  opacity: subtitleOpacity,
                  transform: `translateY(${subtitleY}px)`,
                }}
              >
                <span
                  style={{
                    color: COLORS.text.secondary,
                    fontSize: 24,
                    fontFamily: FONT.body,
                    fontWeight: 500,
                    textShadow: '0 0 20px rgba(217, 119, 6, 0.25)',
                  }}
                >
                  Three engineers, three branches — zero context-switching tax
                </span>
              </div>
            );
          })()}
        </AbsoluteFill>
      );
      })()}

    </AbsoluteFill>
  );
};

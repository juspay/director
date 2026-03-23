/**
 * @reference-scene ExecutionScene
 * @origin v8 — extracted to library 2026-03-23
 * @demonstrates Cross-scene particle continuity + sub-task cycling + shimmer progress bar
 * @dependencies React, remotion (useCurrentFrame, interpolate, spring, AbsoluteFill), ../theme (COLORS, FONTS, SPRINGS), ../timing (FPS, TRANSITION_FRAMES)
 */
import React from 'react';
import { useCurrentFrame, interpolate, spring, AbsoluteFill } from 'remotion';
import { COLORS, FONTS, SPRINGS } from '../theme';
import { FPS, TRANSITION_FRAMES } from '../timing';

// ── Track data ────────────────────────────────────────────────────
interface Track {
  repo: string;
  pr: string;
  /** Relative speed multiplier — slight variation so they don't look identical */
  speed: number;
  /** Stagger delay in frames for when this track's steps begin */
  stagger: number;
}

const TRACKS: Track[] = [
  { repo: 'Nimble', pr: 'PR #3847', speed: 1.0, stagger: 0 },
  { repo: 'Vayu', pr: 'PR #4477', speed: 0.88, stagger: 12 },
  { repo: 'juspay-portal', pr: 'PR #4512', speed: 0.94, stagger: 6 },
];

interface AgentStep {
  label: string;
  icon: string; // emoji or character used as prefix
}

const AGENT_STEPS: AgentStep[] = [
  { label: 'Context gathered', icon: '\u{1F4CB}' },
  { label: 'Repository cloned', icon: '\u{1F4E6}' },
  { label: 'Branch configured', icon: '\u{1F500}' },
  { label: 'Code analyzed', icon: '\u{1F50D}' },
  { label: 'Implementing changes', icon: '\u2699\uFE0F' },
  { label: 'Tests passing', icon: '\u2705' },
];

/** Sub-task labels that cycle under the active "Implementing changes" step */
const SUB_TASKS = [
  'Refactoring function...',
  'Writing unit tests...',
  'Formatting code...',
  'Updating imports...',
  'Validating schema...',
];

// Frame ranges (relative to scene start)
const HERO_HOLD = 60;
const SHATTER_END = 90;
const PROGRESS_END = 300;
const PR_APPEAR = 300;
const PR_SETTLE = 420;
const TAGLINE_START = 420;
const ESTIMATED_DURATION = 840; // ~28s at 30fps

// ── Sub-components ────────────────────────────────────────────────

/** Spinning dot used as in-progress indicator */
const Spinner: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const rotation = (frame * 8) % 360;
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: `2px solid ${color}33`,
        borderTopColor: color,
        transform: `rotate(${rotation}deg)`,
        flexShrink: 0,
      }}
    />
  );
};

/** Checkmark for completed steps — with dramatic spring-pop + rotation */
const Checkmark: React.FC<{ color: string; frame: number; completedAt: number }> = ({
  color,
  frame,
  completedAt,
}) => {
  const animFrame = Math.max(0, frame - completedAt);
  const pop = spring({
    frame: animFrame,
    fps: FPS,
    config: { damping: 6, mass: 0.3, stiffness: 320 },
  });
  const scale = interpolate(pop, [0, 0.5, 0.8, 1], [0.1, 1.45, 0.9, 1]);
  const rotation = interpolate(pop, [0, 0.5, 1], [-15, 8, 0]);

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        width: 12,
        textAlign: 'center',
        flexShrink: 0,
        lineHeight: 1,
        display: 'inline-block',
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        textShadow: pop < 0.8 ? `0 0 6px ${color}88` : 'none',
      }}
    >
      \u2713
    </span>
  );
};

/** A single step row in the agent progress list */
const StepRow: React.FC<{
  step: AgentStep;
  state: 'pending' | 'active' | 'done';
  frame: number;
  enterProgress: number;
  completedAtFrame: number;
}> = ({ step, state, frame, enterProgress, completedAtFrame }) => {
  const opacity = interpolate(enterProgress, [0, 1], [0, 1]);
  const translateX = interpolate(enterProgress, [0, 1], [8, 0]);

  const textColor =
    state === 'done'
      ? COLORS.success
      : state === 'active'
        ? COLORS.amberLight
        : COLORS.textMuted;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        opacity,
        transform: `translateX(${translateX}px)`,
        height: 18,
      }}
    >
      {state === 'done' ? (
        <Checkmark color={COLORS.success} frame={frame} completedAt={completedAtFrame} />
      ) : state === 'active' ? (
        <Spinner frame={frame} color={COLORS.amberLight} />
      ) : (
        <span
          style={{
            width: 12,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: COLORS.textMuted,
            }}
          />
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: textColor,
            fontWeight: state === 'active' ? 500 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {step.label}
          {state === 'active' ? '...' : ''}
        </span>
        {/* Sub-task cycling text for active "Implementing" step */}
        {state === 'active' && step.label === 'Implementing changes' && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.textMuted,
              whiteSpace: 'nowrap',
              marginTop: 1,
            }}
          >
            {SUB_TASKS[Math.floor(frame / 25) % SUB_TASKS.length]}
          </span>
        )}
      </div>
    </div>
  );
};

const ProgressTrack: React.FC<{
  track: Track;
  index: number;
  frame: number;
}> = ({ track, index, frame }) => {
  const trackDelay = SHATTER_END + index * 10;

  // Track card entrance
  const trackEntrance = spring({
    frame,
    fps: FPS,
    config: SPRINGS.gentle,
    delay: trackDelay,
  });

  // Overall progress for this track (0→1 from SHATTER_END to PROGRESS_END)
  // Non-linear: ease-out cubic with micro-stutter bursts at step boundaries
  const progressStart = SHATTER_END + track.stagger;
  const effectiveEnd = progressStart + (PROGRESS_END - SHATTER_END) / track.speed;
  const rawProgress = interpolate(
    frame,
    [progressStart, effectiveEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  // Ease-out cubic for natural deceleration + micro-bursts at step boundaries
  const eased = 1 - Math.pow(1 - rawProgress, 3);
  const stepBurst = Math.sin(rawProgress * Math.PI * 6) * 0.02 * (1 - rawProgress);
  const fillProgress = Math.min(1, Math.max(0, eased + stepBurst));

  // How many steps are done (0 to AGENT_STEPS.length)
  const totalSteps = AGENT_STEPS.length;
  const stepsCompleted = Math.floor(fillProgress * totalSteps);
  // The fractional progress into the current active step
  const currentStepProgress = (fillProgress * totalSteps) % 1;

  // PR badge spring — extra bouncy for impact
  const prSpring = spring({
    frame,
    fps: FPS,
    config: { damping: 9, mass: 0.5, stiffness: 200 },
    delay: PR_APPEAR + index * 18,
  });

  const showPr = frame >= PR_APPEAR;
  const allDone = fillProgress >= 1;

  // Progress bar percentage
  const barPercent = Math.round(fillProgress * 100);

  return (
    <div
      style={{
        opacity: trackEntrance,
        transform: `translateY(${interpolate(trackEntrance, [0, 1], [40, 0])}px)`,
        marginBottom: 20,
        display: 'flex',
        gap: 0,
      }}
    >
      {/* Track card */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          border: `1px solid ${allDone && showPr ? COLORS.success + '44' : COLORS.grayDark + '66'}`,
          borderRadius: 10,
          padding: '14px 18px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Header row: repo name + status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Amber dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: allDone ? COLORS.success : COLORS.amber,
                boxShadow: allDone
                  ? `0 0 6px ${COLORS.success}66`
                  : fillProgress > 0
                    ? `0 0 6px ${COLORS.amber}66`
                    : 'none',
              }}
            />
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              {track.repo}
            </span>
          </div>

          {/* Percentage / Done label */}
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 500,
              color: allDone ? COLORS.success : COLORS.textMuted,
            }}
          >
            {fillProgress > 0 ? (allDone ? 'Complete' : `${barPercent}%`) : ''}
          </span>
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
          {AGENT_STEPS.map((step, si) => {
            // Determine step state
            let state: 'pending' | 'active' | 'done';
            if (si < stepsCompleted) {
              state = 'done';
            } else if (si === stepsCompleted && fillProgress > 0 && !allDone) {
              state = 'active';
            } else if (allDone) {
              state = 'done';
            } else {
              state = 'pending';
            }

            // Each step row fades in with a stagger
            const stepEnterFrame = progressStart + si * 15;
            const enterProgress = interpolate(
              frame,
              [stepEnterFrame, stepEnterFrame + 12],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );

            // Calculate the frame when this step completed
            const stepDuration = (PROGRESS_END - SHATTER_END) / (track.speed * totalSteps);
            const completedAtFrame = progressStart + (si + 1) * stepDuration;

            return (
              <StepRow
                key={si}
                step={step}
                state={state}
                frame={frame}
                enterProgress={enterProgress}
                completedAtFrame={Math.round(completedAtFrame)}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 3,
              backgroundColor: COLORS.grayDark + '88',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${fillProgress * 100}%`,
                backgroundColor: allDone ? COLORS.success : COLORS.amber,
                borderRadius: 2,
                boxShadow:
                  fillProgress > 0 && fillProgress < 1
                    ? `0 0 8px ${COLORS.amberLight}`
                    : allDone
                      ? `0 0 6px ${COLORS.success}66`
                      : 'none',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer gradient sweep while active */}
              {fillProgress > 0 && fillProgress < 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '200%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent 0%, ${COLORS.amberLight}55 30%, transparent 60%)`,
                    transform: `translateX(${((frame * 3) % 200) - 100}%)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* PR badge */}
          {showPr && (
            <div
              style={{
                opacity: prSpring,
                transform: `scale(${interpolate(prSpring, [0, 0.6, 1], [0.5, 1.1, 1])})`,
                backgroundColor: '#0d3320',
                border: `1px solid ${COLORS.success}`,
                borderRadius: 6,
                padding: '3px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
              }}
            >
              {/* Merge icon */}
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                <circle cx={5} cy={3.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                <circle cx={11} cy={12.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                <circle cx={5} cy={12.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                <line x1={5} y1={5.5} x2={5} y2={10.5} stroke={COLORS.success} strokeWidth={1.5} />
                <path d="M5 5.5 C5 9 8 10.5 11 10.5" stroke={COLORS.success} strokeWidth={1.5} fill="none" />
              </svg>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.success,
                }}
              >
                {track.pr}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Scene ────────────────────────────────────────────────────

export const ExecutionScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Global entrance / exit ────────────────────────────────────
  const entranceOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const exitStart = ESTIMATED_DURATION - TRANSITION_FRAMES;
  const exitOpacity = interpolate(
    frame,
    [exitStart, ESTIMATED_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = Math.min(entranceOpacity, exitOpacity);

  // ── Phase 1: "Make it real." hero text ────────────────────────
  const heroOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Pulse / glow at frame 45-60, then shatter
  const heroPulse = interpolate(
    frame,
    [45, 52, 58, SHATTER_END],
    [1, 1.08, 1.08, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const heroGlow = interpolate(
    frame,
    [45, 52, 58, SHATTER_END],
    [0, 0.8, 0.8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Shatter: hero fades and scales down
  const heroShatter = interpolate(frame, [HERO_HOLD, SHATTER_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const heroScale = interpolate(frame, [HERO_HOLD, SHATTER_END], [1, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const showHero = frame < SHATTER_END + 10;

  // ── Phase 3: Tracks section header ────────────────────────────
  const tracksHeaderSpring = spring({
    frame,
    fps: FPS,
    config: SPRINGS.gentle,
    delay: SHATTER_END - 5,
  });

  // ── Phase 5: Tagline ──────────────────────────────────────────
  const taglineSpring = spring({
    frame,
    fps: FPS,
    config: SPRINGS.gentle,
    delay: TAGLINE_START,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        opacity,
        fontFamily: FONTS.sans,
      }}
    >
      {/* ── Hero text: "Make it real." ───────────────────────── */}
      {showHero && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 76,
              fontWeight: 700,
              color: COLORS.amber,
              opacity: heroOpacity * heroShatter,
              transform: `scale(${heroPulse * heroScale})`,
              textShadow:
                heroGlow > 0
                  ? `0 0 ${35 * heroGlow}px ${COLORS.amberLight}, 0 0 ${70 * heroGlow}px ${COLORS.amberDim}`
                  : 'none',
              letterSpacing: -1.5,
            }}
          >
            &lsquo;Make it real.&rsquo;
          </span>
        </AbsoluteFill>
      )}

      {/* ── Parallel coding agent tracks ─────────────────────── */}
      {frame >= SHATTER_END - 5 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 100px',
          }}
        >
          {/* Section header */}
          <div
            style={{
              opacity: tracksHeaderSpring,
              transform: `translateY(${interpolate(tracksHeaderSpring, [0, 1], [15, 0])}px)`,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              alignSelf: 'flex-start',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: COLORS.amber,
                boxShadow: `0 0 8px ${COLORS.amber}88`,
              }}
            />
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              Coding Agent — Parallel Execution
            </span>
          </div>

          {/* Track cards */}
          <div style={{ width: '100%', maxWidth: 900 }}>
            {TRACKS.map((track, i) => (
              <ProgressTrack
                key={track.repo}
                track={track}
                index={i}
                frame={frame}
              />
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* ── Tagline: "Three PRs. One conversation." ─────────── */}
      {frame >= TAGLINE_START - 5 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 70,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.textPrimary,
              opacity: taglineSpring,
              transform: `translateY(${interpolate(taglineSpring, [0, 1], [20, 0])}px)`,
              letterSpacing: -0.5,
            }}
          >
            Three PRs. One conversation.
          </span>
        </AbsoluteFill>
      )}

      {/* ── Exit bridge: PR badge cards shrink, rotate & fly to center ────────── */}
      {/* Creates visual continuity into ReachScene's hub-and-spoke */}
      {frame >= exitStart - 20 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {TRACKS.map((track, i) => {
            const particleStart = exitStart - 15 + i * 5;
            const particleProgress = interpolate(
              frame,
              [particleStart, particleStart + TRANSITION_FRAMES + 15],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            // Start from where PR badges roughly are (right side, staggered vertically)
            const startX = 820 + i * 20;
            const startY = 340 + i * 110;
            // Fly to center of screen (where Reach hub will appear)
            const endX = 960;
            const endY = 460;
            // Ease-in curve for acceleration toward center
            const eased = particleProgress * particleProgress;
            const x = startX + (endX - startX) * eased;
            const y = startY + (endY - startY) * eased;
            // Scale: 1.0 → 0.3 as badges approach center
            const badgeScale = interpolate(particleProgress, [0, 0.3, 0.8, 1], [1.0, 0.9, 0.5, 0.3]);
            const badgeOpacity = interpolate(particleProgress, [0, 0.15, 0.7, 1], [0.95, 1, 0.85, 0]);
            // Rotation: 0 → 180 degrees during flight
            const rotation = interpolate(particleProgress, [0, 1], [0, 180]);
            // Trail length grows as badge accelerates
            const trailLength = interpolate(particleProgress, [0, 0.3, 0.8, 1], [0, 40, 80, 30]);
            const trailOpacity = interpolate(particleProgress, [0, 0.2, 0.7, 1], [0, 0.6, 0.4, 0]);
            // Direction angle for trail (points away from center)
            const dx = startX - endX;
            const dy = startY - endY;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <React.Fragment key={`exit-badge-${i}`}>
                {/* Comet trail / amber streak behind the badge */}
                {trailLength > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y - 2,
                      width: trailLength,
                      height: 4,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, transparent 0%, ${COLORS.amber}66 40%, ${COLORS.amberLight}AA 100%)`,
                      opacity: trailOpacity,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '0% 50%',
                    }}
                  />
                )}

                {/* Miniature PR badge card */}
                <div
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: `translate(-50%, -50%) scale(${badgeScale}) rotate(${rotation}deg)`,
                    opacity: badgeOpacity,
                    backgroundColor: '#0d3320',
                    border: `1px solid ${COLORS.success}`,
                    borderRadius: 6,
                    padding: '3px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: `0 0 ${12 + badgeScale * 10}px ${COLORS.amber}55, 0 0 ${6 + badgeScale * 4}px ${COLORS.success}44`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* Merge icon (same as PR badge in ProgressTrack) */}
                  <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                    <circle cx={5} cy={3.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                    <circle cx={11} cy={12.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                    <circle cx={5} cy={12.5} r={2} stroke={COLORS.success} strokeWidth={1.5} />
                    <line x1={5} y1={5.5} x2={5} y2={10.5} stroke={COLORS.success} strokeWidth={1.5} />
                    <path d="M5 5.5 C5 9 8 10.5 11 10.5" stroke={COLORS.success} strokeWidth={1.5} fill="none" />
                  </svg>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.success,
                    }}
                  >
                    {track.pr}
                  </span>
                </div>

                {/* Secondary afterglow particle trailing behind */}
                {particleProgress > 0.15 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: startX + (endX - startX) * Math.max(0, eased - 0.12),
                      top: startY + (endY - startY) * Math.max(0, eased - 0.12),
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: COLORS.amberLight,
                      opacity: trailOpacity * 0.7,
                      boxShadow: `0 0 10px ${COLORS.amber}AA`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

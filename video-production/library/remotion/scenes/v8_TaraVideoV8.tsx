/**
 * @reference-scene TaraVideoV8
 * @origin v8 — extracted to library 2026-03-23
 * @demonstrates Single-continuous-audio composition + 6 transition overlays + music automation
 * @dependencies React, remotion (AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate), ./theme (COLORS), ./timing (FPS, TOTAL_FRAMES, SCENE_TIMES, secToFrame, TRANSITION_FRAMES), ./scenes/HookScene, ./scenes/MeetTaraScene, ./scenes/CollabScene, ./scenes/ExecutionScene, ./scenes/ReachScene, ./scenes/PayoffScene, ./scenes/IdentityScene
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { COLORS } from './theme';
import {
  FPS,
  TOTAL_FRAMES,
  SCENE_TIMES,
  secToFrame,
  TRANSITION_FRAMES,
} from './timing';

// Scenes
import { HookScene } from './scenes/HookScene';
import { MeetTaraScene } from './scenes/MeetTaraScene';
import { CollabScene } from './scenes/CollabScene';
import { ExecutionScene } from './scenes/ExecutionScene';
import { ReachScene } from './scenes/ReachScene';
import { PayoffScene } from './scenes/PayoffScene';
import { IdentityScene } from './scenes/IdentityScene';

// ─────────────────────────────────────────────────────────
// Transition overlay components
// These render ON TOP of scene sequences to create visual
// bridges during the crossfade windows.
// ─────────────────────────────────────────────────────────

/**
 * Hook → MeetTara: Brief amber radial flash/pulse.
 * 20 frames total — opacity peaks at 0.3 then fades out.
 */
const HookToMeetTaraTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 20;

  // Amber radial pulse
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Thread line drawing downward from center — visual cue of "opening a thread"
  const lineLength = interpolate(progress, [0, 0.8], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.7, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${COLORS.amber}30 0%, transparent 70%)`,
          opacity,
        }}
      />
      {/* Thread line from center downward */}
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 480,
          width: 2,
          height: lineLength,
          background: `linear-gradient(180deg, ${COLORS.amberLight}, ${COLORS.amber}88, transparent)`,
          opacity: lineOpacity,
          transform: 'translateX(-50%)',
          boxShadow: `0 0 8px ${COLORS.amber}44`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Execution → Reach: Convergence flash with concentric rings & converging particles.
 * PR badges have already been flying to center in ExecutionScene's exit bridge.
 * This overlay adds the dramatic "arrival" — a bright flash at center (960, 540),
 * expanding concentric amber rings, and converging spark particles.
 * Total duration: 40 frames.
 */
const CONVERGE_PARTICLE_COUNT = 8;
const RING_COUNT = 6;
const CENTER_X = 960;
const CENTER_Y = 540;

const ExecutionToReachTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 40; // normalized 0→1 over 40 frames

  // ── Bright convergence flash at center — peaks at frame 20 ──
  const flashOpacity = interpolate(frame, [10, 20, 30, 40], [0, 0.85, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashScale = interpolate(frame, [10, 20, 35], [0.3, 1.0, 1.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Central convergence flash */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X,
          top: CENTER_Y,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.amberLight}DD 0%, ${COLORS.amber}88 30%, ${COLORS.amberDim}44 60%, transparent 100%)`,
          opacity: flashOpacity,
          transform: `translate(-50%, -50%) scale(${flashScale})`,
        }}
      />

      {/* Core bright point — small intense dot at dead center */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X,
          top: CENTER_Y,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: COLORS.white,
          opacity: interpolate(frame, [14, 20, 28, 38], [0, 1, 0.5, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          boxShadow: `0 0 30px ${COLORS.amberLight}, 0 0 60px ${COLORS.amber}AA`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── 6 expanding concentric rings pulsing outward from center ── */}
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        // Each ring starts expanding a few frames after the previous
        const ringStart = 12 + i * 3;
        const ringProgress = interpolate(
          frame,
          [ringStart, ringStart + 20],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        const ringRadius = interpolate(ringProgress, [0, 1], [10, 180 + i * 50]);
        const ringOpacity = interpolate(ringProgress, [0, 0.2, 0.6, 1], [0, 0.7 - i * 0.08, 0.3, 0]);
        const ringWidth = interpolate(ringProgress, [0, 1], [3, 1]);

        return (
          <div
            key={`ring-${i}`}
            style={{
              position: 'absolute',
              left: CENTER_X,
              top: CENTER_Y,
              width: ringRadius * 2,
              height: ringRadius * 2,
              borderRadius: '50%',
              border: `${ringWidth}px solid ${COLORS.amberLight}`,
              opacity: ringOpacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${8 + i * 2}px ${COLORS.amber}44`,
            }}
          />
        );
      })}

      {/* ── Converging particles — fly from edges toward center ── */}
      {Array.from({ length: CONVERGE_PARTICLE_COUNT }).map((_, i) => {
        // Distribute start positions around the screen edges
        const angleRad = (i / CONVERGE_PARTICLE_COUNT) * Math.PI * 2;
        const edgeRadius = 500;
        const startX = CENTER_X + Math.cos(angleRad) * edgeRadius;
        const startY = CENTER_Y + Math.sin(angleRad) * edgeRadius;

        // Stagger each particle slightly
        const pDelay = i * 0.04;
        const pProgress = interpolate(t, [pDelay, pDelay + 0.6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        // Ease-in for acceleration toward center
        const eased = pProgress * pProgress;
        const px = startX + (CENTER_X - startX) * eased;
        const py = startY + (CENTER_Y - startY) * eased;

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
              backgroundColor: COLORS.amberLight,
              boxShadow: `0 0 ${size * 3}px ${COLORS.amber}99`,
              opacity: pOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Payoff → Identity: Subtle zoom-into-center with blur pulse.
 * Lasts TRANSITION_FRAMES * 2 frames. Scale goes 1.0 → 1.05,
 * blur fades in then out, creating a gentle "focus shift" feel.
 */
const PayoffToIdentityTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const totalDuration = TRANSITION_FRAMES * 2;
  const progress = frame / totalDuration;

  const scale = interpolate(progress, [0, 1], [1.0, 1.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Blur peaks in the middle of the transition
  const blur = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.15, 0.15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
      }}
    >
      {/* Zoom scale layer — semi-transparent overlay that scales */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at 50% 50%, transparent 30%, ${COLORS.bg}40 100%)`,
          opacity,
          filter: `blur(${blur}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * MeetTara → Collab: Soft scale-dissolve transition.
 * The "A diagnosis." text dissolves as the thread UI gently scales in.
 * 30 frames total — covers the crossfade window.
 */
const COLLAB_TRANSITION_DOTS = 6;
const MeetTaraToCollabTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 30;

  // Gentle center-outward radial wipe
  const radius = interpolate(progress, [0, 1], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bgOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.12, 0.12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(progress, [0, 1], [0.98, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${COLORS.amber}18 0%, transparent ${radius}%)`,
          opacity: bgOpacity,
          transform: `scale(${scale})`,
        }}
      />
      {/* Converging dots — fly toward center to suggest collaborative convergence */}
      {Array.from({ length: COLLAB_TRANSITION_DOTS }).map((_, i) => {
        const angle = (i / COLLAB_TRANSITION_DOTS) * Math.PI * 2;
        const startR = 400;
        const startX = 960 + Math.cos(angle) * startR;
        const startY = 540 + Math.sin(angle) * startR;
        const pDelay = i * 0.06;
        const pProgress = interpolate(progress, [pDelay, pDelay + 0.7], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const eased = pProgress * pProgress; // ease-in
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
              backgroundColor: COLORS.amberLight,
              boxShadow: `0 0 8px ${COLORS.amber}66`,
              opacity: dotOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Collab → Execution: Quick horizontal amber streak.
 * A thin amber line sweeps left-to-right, bridging the visual rhythm.
 * 30 frames total.
 */
const CollabToExecutionTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 30;

  // Primary streak
  const lineX = interpolate(progress, [0, 1], [-200, 2200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineOpacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 0.7, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Trailing secondary streak — slightly behind, dimmer
  const trailX = interpolate(progress, [0.08, 1], [-200, 2200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const trailOpacity = interpolate(progress, [0.08, 0.25, 0.85, 1], [0, 0.35, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Brief scale pulse at center of transition — gives a sense of energy
  const pulseScale = interpolate(progress, [0.3, 0.5, 0.7], [1.0, 1.015, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', transform: `scale(${pulseScale})` }}>
      {/* Primary amber streak line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: lineX,
          width: 300,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.amber}, ${COLORS.amberLight}, transparent)`,
          opacity: lineOpacity,
          transform: 'translateY(-50%)',
          boxShadow: `0 0 12px ${COLORS.amber}60, 0 0 24px ${COLORS.amber}30`,
        }}
      />
      {/* Trailing secondary streak */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% + 8px)',
          left: trailX,
          width: 180,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.amber}AA, ${COLORS.amberLight}88, transparent)`,
          opacity: trailOpacity,
          transform: 'translateY(-50%)',
        }}
      />
      {/* Subtle full-screen flash at midpoint */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${COLORS.amber}10 0%, transparent 60%)`,
          opacity: interpolate(progress, [0.3, 0.5, 0.7], [0, 0.10, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Reach → Payoff: Hub contraction + horizontal amber streak (right to left).
 * 30 frames total. The integrations "collapse" into a result.
 */
const ReachToPayoffTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 30;

  // Contracting radial lines from center
  const contractScale = interpolate(progress, [0, 0.5, 1], [1.0, 0.85, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const contractOpacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 0.15, 0.1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Horizontal amber streak — moves right-to-left
  const streakX = interpolate(progress, [0.2, 1], [2200, -300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const streakOpacity = interpolate(progress, [0.2, 0.4, 0.8, 1], [0, 0.7, 0.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Contracting radial overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 43%, ${COLORS.amber}15 0%, transparent 40%)`,
          opacity: contractOpacity,
          transform: `scale(${contractScale})`,
        }}
      />
      {/* Horizontal amber streak */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: streakX,
          width: 400,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.amberLight}, ${COLORS.amber}, transparent)`,
          opacity: streakOpacity,
          transform: 'translateY(-50%)',
          boxShadow: `0 0 16px ${COLORS.amber}50, 0 0 32px ${COLORS.amber}25`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * TaraVideoV8 — Main composition.
 *
 * KEY ARCHITECTURAL DIFFERENCE FROM V5:
 * - ONE continuous audio track (narration.mp3) — no segments
 * - ONE continuous music track
 * - Scene visuals are Sequences keyed to time in the narration
 * - Transitions are visual-only crossfades (audio is uninterrupted)
 */
export const TaraVideoV8: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene frame calculations
  const scenes = {
    hook: {
      from: secToFrame(SCENE_TIMES.hook.start),
      duration: secToFrame(SCENE_TIMES.hook.end - SCENE_TIMES.hook.start) + TRANSITION_FRAMES,
    },
    meetTara: {
      from: secToFrame(SCENE_TIMES.meetTara.start) - TRANSITION_FRAMES,
      duration: secToFrame(SCENE_TIMES.meetTara.end - SCENE_TIMES.meetTara.start) + TRANSITION_FRAMES * 2,
    },
    collab: {
      from: secToFrame(SCENE_TIMES.collab.start) - TRANSITION_FRAMES,
      duration: secToFrame(SCENE_TIMES.collab.end - SCENE_TIMES.collab.start) + TRANSITION_FRAMES * 2,
    },
    execution: {
      from: secToFrame(SCENE_TIMES.execution.start) - TRANSITION_FRAMES,
      duration: secToFrame(SCENE_TIMES.execution.end - SCENE_TIMES.execution.start) + TRANSITION_FRAMES * 2,
    },
    reach: {
      from: secToFrame(SCENE_TIMES.reach.start) - TRANSITION_FRAMES,
      duration: secToFrame(SCENE_TIMES.reach.end - SCENE_TIMES.reach.start) + TRANSITION_FRAMES * 2,
    },
    payoff: {
      from: secToFrame(SCENE_TIMES.payoff.start) - TRANSITION_FRAMES,
      duration: secToFrame(SCENE_TIMES.payoff.end - SCENE_TIMES.payoff.start) + TRANSITION_FRAMES * 2,
    },
    identity: {
      from: secToFrame(SCENE_TIMES.identity.start) - TRANSITION_FRAMES,
      duration: TOTAL_FRAMES - secToFrame(SCENE_TIMES.identity.start) + TRANSITION_FRAMES,
    },
  };

  // Music volume automation — follows the emotional arc
  // Arc: intrigue (Hook) → warmth (MeetTara) → thoughtful (Collab) →
  //      percussive climax (Execution) → expansive (Reach) → resolve (Identity)
  const musicVolume = (f: number): number => {
    const BASE = 0.10;
    const sec = f / FPS;

    // ── Hook: intrigue → tension build ──────────────────────────
    // Start near-silent, build dramatically to create anticipation
    if (sec < 2) {
      return interpolate(sec, [0, 2], [0, BASE * 0.15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    if (sec < SCENE_TIMES.hook.end) {
      return interpolate(sec, [2, SCENE_TIMES.hook.end], [BASE * 0.15, BASE * 0.9], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }

    // ── Meet Tara: smooth crossfade from hook energy to steady warmth ─
    if (sec < SCENE_TIMES.meetTara.end) {
      return interpolate(
        sec,
        [SCENE_TIMES.meetTara.start, SCENE_TIMES.meetTara.start + 2, SCENE_TIMES.meetTara.end],
        [BASE * 0.9, BASE * 0.8, BASE * 0.8],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    // ── Collaboration: thoughtful, with human-judgment dip ───────
    const humanJudgmentStart = SCENE_TIMES.collab.start + (SCENE_TIMES.collab.end - SCENE_TIMES.collab.start) * 0.6;
    const humanJudgmentEnd = humanJudgmentStart + 6;

    if (sec < SCENE_TIMES.collab.end) {
      // Smooth transition into collab from meetTara level
      if (sec < SCENE_TIMES.collab.start + 1.5) {
        return interpolate(
          sec,
          [SCENE_TIMES.collab.start, SCENE_TIMES.collab.start + 1.5],
          [BASE * 0.8, BASE * 0.7],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
      }
      // Fade into the human-judgment dip
      if (sec >= humanJudgmentStart - 1 && sec < humanJudgmentStart) {
        return interpolate(sec, [humanJudgmentStart - 1, humanJudgmentStart], [BASE * 0.7, BASE * 0.3], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      }
      // Percussion drops for "human judgment"
      if (sec >= humanJudgmentStart && sec < humanJudgmentEnd - 1) {
        return BASE * 0.3;
      }
      // Recover from dip toward collab end
      if (sec >= humanJudgmentEnd - 1 && sec < humanJudgmentEnd) {
        return interpolate(sec, [humanJudgmentEnd - 1, humanJudgmentEnd], [BASE * 0.3, BASE * 0.7], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      }
      return BASE * 0.7;
    }

    // ── Execution: percussive climax — the emotional peak ───────
    const forkMoment = SCENE_TIMES.execution.start + 3;

    if (sec < SCENE_TIMES.execution.end) {
      // Smooth ramp into execution from collab level
      if (sec < forkMoment - 2) {
        return interpolate(
          sec,
          [SCENE_TIMES.execution.start, forkMoment - 2],
          [BASE * 0.7, BASE],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
      }
      // Tension build → silence right before the drop
      if (sec < forkMoment) {
        return interpolate(sec, [forkMoment - 2, forkMoment], [BASE, 0.02], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      }
      // Bass drop — louder hit
      if (sec < forkMoment + 0.5) return 0.25;
      // Sustain high energy after drop
      if (sec < forkMoment + 2) {
        return interpolate(sec, [forkMoment + 0.5, forkMoment + 2], [0.25, BASE * 1.8], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      }
      // Sustained percussive energy through end of execution
      return BASE * 1.8;
    }

    // ── Reach: flowing, expansive — ease down from climax ───────
    if (sec < SCENE_TIMES.reach.end) {
      return interpolate(
        sec,
        [SCENE_TIMES.reach.start, SCENE_TIMES.reach.start + 2, SCENE_TIMES.reach.end],
        [BASE * 1.8, BASE * 1.0, BASE * 1.0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    // ── Payoff: brief reflective dip for "Phase Zero" ───────────
    if (sec < SCENE_TIMES.payoff.end) {
      return interpolate(
        sec,
        [SCENE_TIMES.payoff.start, SCENE_TIMES.payoff.start + 1, SCENE_TIMES.payoff.end],
        [BASE * 1.0, BASE * 0.5, BASE * 0.5],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    // ── Identity: confident optimism → crescendo → gentle fade ──
    const fadeStart = SCENE_TIMES.identity.end - 3;
    if (sec < fadeStart) {
      return interpolate(
        sec,
        [SCENE_TIMES.identity.start, SCENE_TIMES.identity.start + 1.5, fadeStart],
        [BASE * 0.5, BASE * 0.8, BASE * 1.2],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }
    // Final 3-second taper to silence
    return interpolate(sec, [fadeStart, SCENE_TIMES.identity.end], [BASE * 1.2, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* ═══════════════════════════════════════════════════
          LAYER 1: Background — subtle gradient
          ═══════════════════════════════════════════════════ */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bgLight}33 0%, transparent 70%)`,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          LAYER 2: Continuous narration — ONE audio file
          ═══════════════════════════════════════════════════ */}
      <Audio src={staticFile('voiceover/narration.mp3')} volume={1} />

      {/* ═══════════════════════════════════════════════════
          LAYER 3: Continuous music
          ═══════════════════════════════════════════════════ */}
      <Audio src={staticFile('music/background.wav')} volume={musicVolume} />

      {/* ═══════════════════════════════════════════════════
          LAYER 4: Visual scenes — each a Sequence keyed to time
          Scenes overlap slightly for visual crossfade transitions.
          Audio is NOT affected — it plays continuously.
          ═══════════════════════════════════════════════════ */}

      <Sequence from={scenes.hook.from} durationInFrames={scenes.hook.duration} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={scenes.meetTara.from} durationInFrames={scenes.meetTara.duration} name="MeetTara">
        <MeetTaraScene />
      </Sequence>

      <Sequence from={scenes.collab.from} durationInFrames={scenes.collab.duration} name="Collab">
        <CollabScene />
      </Sequence>

      <Sequence from={scenes.execution.from} durationInFrames={scenes.execution.duration} name="Execution">
        <ExecutionScene />
      </Sequence>

      <Sequence from={scenes.reach.from} durationInFrames={scenes.reach.duration} name="Reach">
        <ReachScene />
      </Sequence>

      <Sequence from={scenes.payoff.from} durationInFrames={scenes.payoff.duration} name="Payoff">
        <PayoffScene />
      </Sequence>

      <Sequence from={scenes.identity.from} durationInFrames={scenes.identity.duration} name="Identity">
        <IdentityScene />
      </Sequence>

      {/* ═══════════════════════════════════════════════════
          LAYER 5: Transition overlays — visual bridges
          between scenes, layered ON TOP of scene sequences.
          ═══════════════════════════════════════════════════ */}

      {/* ── Hook → MeetTara: Amber radial pulse ──────────── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.hook.end) - 10}
        durationInFrames={20}
        name="Transition_Hook_MeetTara"
      >
        <HookToMeetTaraTransition />
      </Sequence>

      {/* ── MeetTara → Collab: Soft scale-dissolve ────────── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.meetTara.end) - 15}
        durationInFrames={30}
        name="Transition_MeetTara_Collab"
      >
        <MeetTaraToCollabTransition />
      </Sequence>

      {/* ── Collab → Execution: Quick amber streak ─────── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.collab.end) - 15}
        durationInFrames={30}
        name="Transition_Collab_Execution"
      >
        <CollabToExecutionTransition />
      </Sequence>

      {/* ── Execution → Reach: Flying amber particles ────── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.execution.end) - 20}
        durationInFrames={40}
        name="Transition_Execution_Reach"
      >
        <ExecutionToReachTransition />
      </Sequence>

      {/* ── Reach → Payoff: Hub contraction + streak ──────── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.reach.end) - 15}
        durationInFrames={30}
        name="Transition_Reach_Payoff"
      >
        <ReachToPayoffTransition />
      </Sequence>

      {/* ── Payoff → Identity: Zoom-into-center effect ───── */}
      <Sequence
        from={secToFrame(SCENE_TIMES.payoff.end) - TRANSITION_FRAMES}
        durationInFrames={TRANSITION_FRAMES * 2}
        name="Transition_Payoff_Identity"
      >
        <PayoffToIdentityTransition />
      </Sequence>

      {/* ═══════════════════════════════════════════════════
          LAYER 6: Vignette — cinematic edge darkening
          ═══════════════════════════════════════════════════ */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};

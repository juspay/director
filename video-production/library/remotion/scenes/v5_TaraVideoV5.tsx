/**
 * @reference-scene TaraVideoV5
 * @origin v5 — extracted to library 2026-03-23
 * @demonstrates 5-layer composition architecture + volume automation
 * @dependencies SCENES, TOTAL_FRAMES from durations; COLORS from theme; AnimatedDotGrid from components; HookScene, MeetTaraScene, CollabScene, ExecutionScene, ReachScene, PayoffScene, IdentityScene from scenes
 */
import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';
import { SCENES, TOTAL_FRAMES } from './durations';
import { COLORS } from './theme';
import { AnimatedDotGrid } from './components/AnimatedDotGrid';
import { HookScene } from './scenes/HookScene';
import { MeetTaraScene } from './scenes/MeetTaraScene';
import { CollabScene } from './scenes/CollabScene';
import { ExecutionScene } from './scenes/ExecutionScene';
import { ReachScene } from './scenes/ReachScene';
import { PayoffScene } from './scenes/PayoffScene';
import { IdentityScene } from './scenes/IdentityScene';

const getScene = (id: string) => SCENES.find((s) => s.id === id)!;

/**
 * TaraVideoV5 — Main composition for TARA announcement video v5.
 *
 * Architecture:
 * - AnimatedDotGrid: persistent ambient background across all scenes
 * - 7 overlapping Sequences: each scene handles its own morph-in/morph-out
 *   within the MORPH_OVERLAP window (45 frames = 1.5s)
 * - Continuous music with dynamic volume automation
 * - Per-scene voiceover audio
 * - SFX layer timed to visual events
 * - Background vignette for cinematic edge darkening
 */
export const TaraVideoV5: React.FC = () => {
  const s1 = getScene('seg1_hook');
  const s2 = getScene('seg2_tara');
  const s3 = getScene('seg3_collab');
  const s4 = getScene('seg4_execute');
  const s5 = getScene('seg5_reach');
  const s6 = getScene('seg6_payoff');
  const s7 = getScene('seg7_identity');

  return (
    <div style={{ flex: 1, backgroundColor: COLORS.bg.primary }}>
      {/* ═══════════════════════════════════════════════════════════
          LAYER 1: Animated dot grid — persistent ambient motion
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedDotGrid
        impactFrames={[
          // Star birth (MeetTara scene start)
          { frame: s2.startFrame, x: 960, y: 280, radius: 600, intensity: 0.8 },
          // Fork shatter (ExecutionScene FORK_START=60 relative)
          { frame: s4.startFrame + 60, x: 960, y: 260, radius: 800, intensity: 1.2 },
          // Phase Zero reveal (PayoffScene PHASE_ZERO_START=100 relative)
          { frame: s6.startFrame + 100, x: 960, y: 460, radius: 500, intensity: 0.6 },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════
          LAYER 2: Background music — one continuous arc
          v5 music direction: silence at 0:00, builds through
          collaboration, drops percussion for "human judgment",
          bass drop at fork, first melody at identity.
          ═══════════════════════════════════════════════════════════ */}
      <Audio
        src={staticFile('music/background_music_looped.mp3')}
        volume={(f: number) => {
          const BASE_VOL = 0.12;

          // --- Silence at the very start (0:00-0:02) ---
          if (f < 60) {
            return interpolate(f, [0, 60], [0, BASE_VOL * 0.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          // --- Gradual build through Hook ---
          if (f < s1.startFrame + s1.durationFrames) {
            return interpolate(f, [60, s1.startFrame + s1.durationFrames], [BASE_VOL * 0.5, BASE_VOL * 0.8], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          // --- Dip 1: "Human judgment" moment in Collab scene ---
          // "the thinking, the debating, the human judgment" — percussion drops out
          const humanJudgmentStart = s3.startFrame + 360; // ~12s into collab
          const humanJudgmentEnd = s3.startFrame + 540;   // ~18s into collab
          if (f >= humanJudgmentStart - 30 && f < humanJudgmentEnd) {
            const dipProgress = interpolate(f, [humanJudgmentStart - 30, humanJudgmentStart], [BASE_VOL, BASE_VOL * 0.4], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (f < humanJudgmentStart) return dipProgress;
            return BASE_VOL * 0.4;
          }
          if (f >= humanJudgmentEnd && f < humanJudgmentEnd + 30) {
            return interpolate(f, [humanJudgmentEnd, humanJudgmentEnd + 30], [BASE_VOL * 0.4, BASE_VOL], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          // --- Dip 2: Pre-fork silence in Execution scene ---
          // "Make it real" — near silence before the bass drop
          const forkFrame = s4.startFrame + 60;
          const preForkStart = s4.startFrame + 30;
          if (f >= preForkStart && f < forkFrame) {
            return interpolate(f, [preForkStart, forkFrame], [BASE_VOL, 0.02], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
          // Bass drop + snap back at fork
          if (f >= forkFrame && f < forkFrame + 10) {
            return 0.25; // Peak volume for impact
          }
          if (f >= forkFrame + 10 && f < forkFrame + 45) {
            return interpolate(f, [forkFrame + 10, forkFrame + 45], [0.25, BASE_VOL * 1.2], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          // --- Build momentum through Execution ---
          if (f >= s4.startFrame && f < s4.startFrame + s4.durationFrames) {
            return BASE_VOL * 1.2; // Elevated energy
          }

          // --- Ecosystem: floating, expansive ---
          if (f >= s5.startFrame && f < s5.startFrame + s5.durationFrames) {
            return BASE_VOL * 1.1;
          }

          // --- Dip 3: Phase Zero reveal ---
          const phaseZeroFrame = s6.startFrame + 100;
          if (f >= phaseZeroFrame - 30 && f < phaseZeroFrame) {
            return interpolate(f, [phaseZeroFrame - 30, phaseZeroFrame], [BASE_VOL, 0.03], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
          if (f >= phaseZeroFrame && f < phaseZeroFrame + 30) {
            return interpolate(f, [phaseZeroFrame, phaseZeroFrame + 30], [0.03, BASE_VOL], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          // --- Identity: first melody, warm build to resolution ---
          if (f >= s7.startFrame) {
            const identityEnd = s7.startFrame + s7.durationFrames;
            // Build to final resolution, then ring out
            if (f > identityEnd - 60) {
              return interpolate(f, [identityEnd - 60, identityEnd], [BASE_VOL * 1.3, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
            }
            return interpolate(f, [s7.startFrame, identityEnd - 60], [BASE_VOL, BASE_VOL * 1.3], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          return BASE_VOL;
        }}
      />

      {/* ═══════════════════════════════════════════════════════════
          LAYER 3: Scene sequences with per-scene voiceover
          Each scene handles its own morph-in/morph-out within
          the MORPH_OVERLAP window. Scenes overlap by 45 frames.
          ═══════════════════════════════════════════════════════════ */}

      {/* Scene 1: The Hook — "Thirteen minutes..." */}
      <Sequence from={s1.startFrame} durationInFrames={s1.durationFrames} name="Hook">
        <Audio src={staticFile('voiceover/seg1_hook.mp3')} volume={1} />
        <HookScene />
      </Sequence>

      {/* Scene 2: Meet Tara — "Tara. She lives in your team's Slack..." */}
      <Sequence from={s2.startFrame} durationInFrames={s2.durationFrames} name="MeetTara">
        <Audio src={staticFile('voiceover/seg2_tara.mp3')} volume={1} />
        <MeetTaraScene />
      </Sequence>

      {/* Scene 3: Collaboration — "And now the thread becomes the workspace..." */}
      <Sequence from={s3.startFrame} durationInFrames={s3.durationFrames} name="Collab">
        <Audio src={staticFile('voiceover/seg3_collab.mp3')} volume={1} />
        <CollabScene />
      </Sequence>

      {/* Scene 4: Execution — "'Make it real.'..." */}
      <Sequence from={s4.startFrame} durationInFrames={s4.durationFrames} name="Execution">
        <Audio src={staticFile('voiceover/seg4_execute.mp3')} volume={1} />
        <ExecutionScene />
      </Sequence>

      {/* Scene 5: The Reach — "She does this because she's connected..." */}
      <Sequence from={s5.startFrame} durationInFrames={s5.durationFrames} name="Reach">
        <Audio src={staticFile('voiceover/seg5_reach.mp3')} volume={1} />
        <ReachScene />
      </Sequence>

      {/* Scene 6: The Payoff — "From a screenshot to production..." */}
      <Sequence from={s6.startFrame} durationInFrames={s6.durationFrames} name="Payoff">
        <Audio src={staticFile('voiceover/seg6_payoff.mp3')} volume={1} />
        <PayoffScene />
      </Sequence>

      {/* Scene 7: The Identity — "Coder becomes engineer..." */}
      <Sequence from={s7.startFrame} durationInFrames={s7.durationFrames} name="Identity">
        <Audio src={staticFile('voiceover/seg7_identity.mp3')} volume={1} />
        <IdentityScene />
      </Sequence>

      {/* ═══════════════════════════════════════════════════════════
          LAYER 4: Background vignette — cinematic edge darkening
          ═══════════════════════════════════════════════════════════ */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* ═══════════════════════════════════════════════════════════
          LAYER 5: Sound Effects — Musical, part of the track
          All SFX volumes reduced ~60% from v2 learnings.
          SFX files reused from v2 (pre-boosted with limiter).
          ═══════════════════════════════════════════════════════════ */}

      {/* ---- Scene 1: Hook SFX ---- */}
      {/* Timer tick at start */}
      <Sequence from={s1.startFrame + 60} durationInFrames={15} name="SFX tick – timer start">
        <Audio src={staticFile('sfx/tick.mp3')} volume={0.3} />
      </Sequence>
      {/* Result card chimes (staggered with badges) */}
      <Sequence from={s1.startFrame + 180} durationInFrames={60} name="SFX chime – file badge">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={s1.startFrame + 200} durationInFrames={60} name="SFX chime – JIRA badge">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={s1.startFrame + 220} durationInFrames={60} name="SFX chime – PR badge">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.35} />
      </Sequence>
      {/* Implosion morph - reverse cymbal effect */}
      <Sequence from={s1.startFrame + 420} durationInFrames={45} name="SFX whoosh – implosion">
        <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.4} />
      </Sequence>

      {/* ---- Scene 2: Meet Tara SFX ---- */}
      {/* Star birth bass hit */}
      <Sequence from={s2.startFrame} durationInFrames={60} name="SFX fork – star birth impact">
        <Audio src={staticFile('sfx/fork.mp3')} volume={0.5} />
      </Sequence>
      {/* Investigation node pings (ascending pitch simulated by slight volume increase) */}
      <Sequence from={s2.startFrame + 120} durationInFrames={30} name="SFX pop – screenshot node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s2.startFrame + 150} durationInFrames={30} name="SFX pop – codebase node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.28} />
      </Sequence>
      <Sequence from={s2.startFrame + 180} durationInFrames={30} name="SFX pop – jira node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.31} />
      </Sequence>
      <Sequence from={s2.startFrame + 210} durationInFrames={30} name="SFX pop – root cause node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.35} />
      </Sequence>
      {/* Diagnosis reveal chime */}
      <Sequence from={s2.startFrame + 240} durationInFrames={60} name="SFX chime – diagnosis">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.4} />
      </Sequence>

      {/* ---- Scene 3: Collaboration SFX ---- */}
      {/* Thread message pops */}
      <Sequence from={s3.startFrame + 30} durationInFrames={30} name="SFX pop – tara msg">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s3.startFrame + 75} durationInFrames={30} name="SFX pop – PM msg">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s3.startFrame + 135} durationInFrames={30} name="SFX pop – engineer msg">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s3.startFrame + 195} durationInFrames={30} name="SFX pop – designer msg">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      {/* Plan item check ticks */}
      <Sequence from={s3.startFrame + 280} durationInFrames={15} name="SFX tick – check 1">
        <Audio src={staticFile('sfx/tick.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={s3.startFrame + 300} durationInFrames={15} name="SFX tick – check 2">
        <Audio src={staticFile('sfx/tick.mp3')} volume={0.3} />
      </Sequence>

      {/* ---- Scene 4: Execution SFX ---- */}
      {/* THE FORK — hero moment, still louder than other SFX */}
      <Sequence from={s4.startFrame + 60} durationInFrames={60} name="SFX fork – the split">
        <Audio src={staticFile('sfx/fork.mp3')} volume={0.8} />
      </Sequence>
      {/* Typing during build phase */}
      <Sequence from={s4.startFrame + 120} durationInFrames={90} name="SFX typing – build starts">
        <Audio src={staticFile('sfx/typing.mp3')} volume={0.2} />
      </Sequence>
      {/* PR completion chimes */}
      <Sequence from={s4.startFrame + 420} durationInFrames={60} name="SFX chime – PR 1">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={s4.startFrame + 460} durationInFrames={60} name="SFX chime – PR 2">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={s4.startFrame + 500} durationInFrames={60} name="SFX chime – PR 3">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.4} />
      </Sequence>

      {/* ---- Scene 5: Reach SFX ---- */}
      <Sequence from={s5.startFrame} durationInFrames={45} name="SFX whoosh – to reach">
        <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
      </Sequence>
      {/* Tonal pings for tool node activation */}
      <Sequence from={s5.startFrame + 30} durationInFrames={30} name="SFX pop – JIRA node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s5.startFrame + 45} durationInFrames={30} name="SFX pop – Bitbucket node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s5.startFrame + 60} durationInFrames={30} name="SFX pop – GitHub node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      <Sequence from={s5.startFrame + 75} durationInFrames={30} name="SFX pop – Figma node">
        <Audio src={staticFile('sfx/pop.mp3')} volume={0.25} />
      </Sequence>
      {/* Scan for ecosystem reveal */}
      <Sequence from={s5.startFrame + 180} durationInFrames={90} name="SFX scan – ecosystem">
        <Audio src={staticFile('sfx/scan.mp3')} volume={0.25} />
      </Sequence>

      {/* ---- Scene 6: Payoff SFX ---- */}
      <Sequence from={s6.startFrame} durationInFrames={45} name="SFX whoosh – collapse">
        <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.35} />
      </Sequence>
      {/* Phase Zero reveal */}
      <Sequence from={s6.startFrame + 100} durationInFrames={60} name="SFX chime – Phase Zero">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.35} />
      </Sequence>

      {/* ---- Scene 7: Identity SFX ---- */}
      {/* Constellation settling */}
      <Sequence from={s7.startFrame} durationInFrames={45} name="SFX whoosh – explosion">
        <Audio src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
      </Sequence>
      {/* TARA logo reveal */}
      <Sequence from={s7.startFrame + 360} durationInFrames={90} name="SFX scan – logo reveal">
        <Audio src={staticFile('sfx/scan.mp3')} volume={0.3} />
      </Sequence>
      {/* Final chime on "Build what matters" */}
      <Sequence from={s7.startFrame + 420} durationInFrames={60} name="SFX chime – tagline">
        <Audio src={staticFile('sfx/chime.mp3')} volume={0.4} />
      </Sequence>
    </div>
  );
};

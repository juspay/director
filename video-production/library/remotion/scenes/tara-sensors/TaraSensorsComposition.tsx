/**
 * @reference-scene TaraSensorsComposition (hippocampus-format revision)
 * @origin Tara Sensors announcement video — revised 2026-05-07
 * @demonstrates 10-scene pitch video introducing Sensors as a runtime
 *   intelligence engine. Adopts the hippocampus visual system
 *   (deep navy + parallax aurora, cyan-dominant palette, heavy typography,
 *   floating neurons). Tells a continuous arc: reactive problem →
 *   product reveal → inversion (engine next to app) → mechanism → proof
 *   on Tara (3 catches) → autonomy → standalone product → multi-app
 *   rollout (just the beginning) → vision → outro.
 *
 * 10-scene layout (1920x1080 @ 30fps):
 *   1.  Hook        — "Most software waits to break · Not anymore."
 *   2.  Intro       — "Introducing Sensors"
 *   3.  Inversion   — engine next to the application
 *   4.  Pattern     — reads / ranks / recommends ("It", not "She")
 *   5.  Live Tara   — three real catches (JIRA, search_all_streams, Read)
 *   6.  Self-fixing — research threads, autonomous filing
 *   7.  Product     — Sensors as a separate product
 *   8.  Multi-app   — "And this is just the beginning" — Dashboard, UPI, Breeze
 *   9.  Vision      — software that works on itself
 *  10.  Outro       — Build What Matters
 *
 * Audio assets (generated at build time, NOT committed):
 *   public/voiceover/tara-sensors/01-hook.mp3 … 10-outro.mp3 — voiceover
 *   public/voiceover/tara-sensors/music-01.mp3                — background
 *
 * Run `node scripts/generate-voiceover.mjs tara-sensors` and
 * `node scripts/generate-music.mjs tara-sensors` to populate before render.
 */
import React from 'react';
import {
  AbsoluteFill,
  Img,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont } from '@remotion/google-fonts/Inter';

// ── Fonts ────────────────────────────────────────────────────────────────

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin'],
});

const MONO = 'ui-monospace, SFMono-Regular, Menlo, JetBrains Mono, monospace';

// ── Palette (hippocampus-aligned, with sensors accent shift) ─────────────

const NAVY_DEEP = '#070C1E';
const NAVY = '#0B1226';
const NAVY_MID = '#141B3A';
const INDIGO = '#1E1B4B';
const CYAN = '#22D3EE';
const CYAN_DEEP = '#06B6D4';
const AMBER = '#F59E0B';
const PINK = '#F472B6';
const RED = '#F87171';
const GREEN = '#34D399';
const VIOLET = '#A78BFA';
const SKY = '#7DD3FC';
const WHITE_70 = 'rgba(255,255,255,0.7)';
const WHITE_85 = 'rgba(255,255,255,0.85)';
const WHITE_95 = 'rgba(255,255,255,0.95)';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// ── Background (deep-navy + parallax aurora) ─────────────────────────────

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame / 30) * 8;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 45%, ${INDIGO} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(circle at ${30 + drift}% 30%, rgba(34,211,238,0.18) 0%, transparent 50%),` +
            `radial-gradient(circle at ${75 - drift / 2}% 75%, rgba(167,139,250,0.16) 0%, transparent 55%),` +
            `radial-gradient(circle at ${50 + drift / 3}% 110%, rgba(245,158,11,0.10) 0%, transparent 50%)`,
          filter: 'blur(2px)',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};

const FloatingNeurons: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.55, pointerEvents: 'none' }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const seed = i * 91.7;
        const x = (Math.sin(seed) * 0.5 + 0.5) * 1920;
        const y = (Math.cos(seed * 1.9) * 0.5 + 0.5) * 1080;
        const drift = Math.sin((frame + i * 14) / 36) * 22;
        const size = 4 + (i % 4) * 4;
        const color = i % 3 === 0 ? AMBER : i % 3 === 1 ? CYAN : VIOLET;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y + drift,
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BackgroundMusic: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.round(0.8 * fps);
  const BASE = 0.08;
  const volume = (f: number) => {
    if (f < fadeFrames) return (f / fadeFrames) * BASE;
    if (f > durationInFrames - fadeFrames)
      return Math.max(0, ((durationInFrames - f) / fadeFrames) * BASE);
    return BASE;
  };
  return (
    <Audio src={staticFile('voiceover/tara-sensors/music-01.mp3')} volume={volume} loop />
  );
};

// ── Wordmark watermark (top-left, small) ─────────────────────────────────

const SensorsWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin((frame / 30) * 2 * Math.PI) * 0.08;
  return (
    <div style={{ position: 'absolute', top: 38, left: 48, display: 'flex', alignItems: 'center', gap: 14, zIndex: 10 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: CYAN, boxShadow: `0 0 ${14 * pulse}px ${CYAN}`, transform: `scale(${pulse})` }} />
      <div style={{ fontFamily, color: WHITE_85, fontSize: 22, fontWeight: 800, letterSpacing: 4 }}>SENSORS</div>
    </div>
  );
};

// ── Eyebrow (small uppercase tag at top of each scene) ───────────────────

const Eyebrow: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 14], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        opacity: op,
        fontFamily,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 6,
        textTransform: 'uppercase',
        color,
        marginBottom: 26,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        justifyContent: 'center',
      }}
    >
      <span style={{ width: 28, height: 2, background: color }} />
      {text}
      <span style={{ width: 28, height: 2, background: color }} />
    </div>
  );
};

// ── Tara avatar (full + badge sizes) ─────────────────────────────────────
// Source: public/products/tara.png is 1024×1536 (portrait). Using
// objectFit:cover with objectPosition biased upward so the visible
// square shows head + shoulders + brain logo (the upper ~70% of the
// source), matching the reference avatar from tara-skills/hippocampus.

const TARA_OBJECT_POSITION = '50% 18%';

const TaraAvatar: React.FC<{ size?: number }> = ({ size = 220 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        overflow: 'hidden',
        border: `${Math.max(4, size * 0.025)}px solid white`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        background: NAVY_MID,
      }}
    >
      <Img
        src={staticFile('products/tara.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: TARA_OBJECT_POSITION,
        }}
      />
    </div>
  );
};

const TaraBadge: React.FC<{ size?: number }> = ({ size = 56 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        overflow: 'hidden',
        border: `2px solid ${CYAN}88`,
        boxShadow: `0 8px 24px ${CYAN}33`,
        background: NAVY_MID,
      }}
    >
      <Img
        src={staticFile('products/tara.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: TARA_OBJECT_POSITION,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 1 · Hook — "Most software waits to break"
// ─────────────────────────────────────────────────────────────────────────

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordOp = interpolate(frame, [10, 36], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 110, mass: 0.85 } });

  const subOp = interpolate(frame, [40, 70], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const loopWords = ['Logs.', 'Alerts.', 'Humans.', 'Patches.'];

  // "Not anymore." beat — strikes through the loop at the end of the scene
  const notAnymoreOp = interpolate(frame, [130, 160], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const notAnymoreScale = spring({ frame: frame - 130, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });
  const strikeOp = interpolate(frame, [125, 155], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <SensorsWatermark />
      <Eyebrow text="The reactive loop" color={RED} />
      <div style={{ opacity: wordOp, transform: `scale(${wordScale})`, fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, color: WHITE_95, maxWidth: 1700 }}>
        Most software <span style={{ color: RED }}>waits</span> to <span style={{ color: PINK }}>break</span>.
      </div>
      <div style={{ marginTop: 56, opacity: subOp, display: 'flex', gap: 22, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
        {loopWords.map((w, i) => {
          const start = 50 + i * 18;
          const op = interpolate(frame, [start, start + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <React.Fragment key={i}>
              <div style={{ opacity: op, fontFamily: MONO, fontSize: 36, fontWeight: 800, color: WHITE_85, padding: '12px 24px', borderRadius: 12, border: `1px solid ${RED}55`, background: 'rgba(248,113,113,0.08)' }}>{w}</div>
              {i < loopWords.length - 1 && <div style={{ opacity: op, fontSize: 32, color: WHITE_70 }}>→</div>}
            </React.Fragment>
          );
        })}
        {/* strike-through line that sweeps across the loop */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: CYAN, transform: `scaleX(${strikeOp})`, transformOrigin: 'left', boxShadow: `0 0 16px ${CYAN}`, marginTop: -2 }} />
      </div>
      <div style={{ marginTop: 40, opacity: notAnymoreOp, transform: `scale(${notAnymoreScale})`, fontSize: 64, fontWeight: 900, letterSpacing: -1, color: CYAN, filter: `drop-shadow(0 0 24px ${CYAN}99)` }}>
        Not anymore.
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 2 · Intro — formal product reveal
// ─────────────────────────────────────────────────────────────────────────

const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eyebrowOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordmarkScale = spring({ frame: frame - 12, fps, config: { damping: 11, stiffness: 110, mass: 0.85 } });
  const wordmarkOp = interpolate(frame, [12, 40], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordmarkY = interpolate(frame, [12, 40], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [40, 64], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dotPulse = 1 + Math.sin((frame / 30) * 2.6 * Math.PI) * 0.2;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: eyebrowOp, fontSize: 28, fontWeight: 800, letterSpacing: 8, color: AMBER, textTransform: 'uppercase', marginBottom: 30 }}>
        Introducing
      </div>
      <div style={{ opacity: wordmarkOp, transform: `translateY(${wordmarkY}px) scale(${wordmarkScale})`, fontSize: 200, fontWeight: 900, letterSpacing: -6, lineHeight: 1, background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 14px 50px ${CYAN}55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: CYAN, boxShadow: `0 0 ${28 * dotPulse}px ${CYAN}`, transform: `scale(${dotPulse})`, flexShrink: 0 }} />
        SENSORS
      </div>
      <div style={{ marginTop: 26, opacity: subOp, fontSize: 32, fontWeight: 600, color: WHITE_85, letterSpacing: 1, fontStyle: 'italic' }}>
        Tara's runtime intelligence — observing itself, every cycle.
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 3 · Inversion — engine next to the application
// ─────────────────────────────────────────────────────────────────────────

const SceneInversion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const appScale = spring({ frame: frame - 24, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const appOp = interpolate(frame, [24, 46], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sensorScale = spring({ frame: frame - 60, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const sensorOp = interpolate(frame, [60, 84], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const linkOp = interpolate(frame, [84, 110], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOp = interpolate(frame, [100, 130], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 50 }}>
        <Eyebrow text="The inversion" color={CYAN} />
        <div style={{ fontSize: 64, fontWeight: 800, color: WHITE_95, letterSpacing: -1.5, lineHeight: 1.15, maxWidth: 1500 }}>
          Move observability <span style={{ color: CYAN }}>next to</span> the application.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {/* Application box */}
        <div style={{ opacity: appOp, transform: `scale(${appScale})`, width: 380, height: 240, borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px rgba(255,255,255,0.06)', gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 22, color: WHITE_70, letterSpacing: 4 }}>APPLICATION</div>
          <div style={{ fontSize: 50, fontWeight: 900, color: WHITE_95, letterSpacing: -1 }}>your app</div>
          <div style={{ fontFamily: MONO, fontSize: 18, color: WHITE_70 }}>:: emitting telemetry</div>
        </div>
        {/* Connector */}
        <div style={{ opacity: linkOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 80, height: 3, background: `linear-gradient(90deg, ${CYAN}, ${VIOLET})`, boxShadow: `0 0 18px ${CYAN}` }} />
          <div style={{ fontFamily: MONO, fontSize: 14, color: CYAN, letterSpacing: 1 }}>local</div>
          <div style={{ width: 80, height: 3, background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`, boxShadow: `0 0 18px ${VIOLET}` }} />
        </div>
        {/* Sensor engine */}
        <div style={{ opacity: sensorOp, transform: `scale(${sensorScale})`, width: 380, height: 240, borderRadius: 22, background: 'rgba(34,211,238,0.10)', border: `2px solid ${CYAN}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 24px 60px ${CYAN}55, inset 0 0 40px ${CYAN}22`, gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 22, color: CYAN, letterSpacing: 4 }}>ENGINE</div>
          <div style={{ fontSize: 50, fontWeight: 900, color: CYAN, letterSpacing: -1, filter: `drop-shadow(0 0 18px ${CYAN}88)` }}>sensors</div>
          <div style={{ fontFamily: MONO, fontSize: 18, color: WHITE_85 }}>:: reads · ranks · recommends</div>
        </div>
      </div>
      <div style={{ marginTop: 40, opacity: labelOp, fontSize: 24, fontWeight: 600, color: WHITE_70, letterSpacing: 1, textAlign: 'center', maxWidth: 1300, fontStyle: 'italic' }}>
        not a dashboard somewhere else — the engine lives <span style={{ color: CYAN, fontWeight: 800, fontStyle: 'normal' }}>here</span>, with the app.
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 4 · Pattern — reads / ranks / recommends
// ─────────────────────────────────────────────────────────────────────────

const PATTERN_TILES = [
  { verb: 'Reads', sub: 'live logs · traces · telemetry', color: GREEN, glyph: '⎯⎯' },
  { verb: 'Ranks', sub: 'severity · evidence · impact', color: AMBER, glyph: '▣▤' },
  { verb: 'Recommends', sub: 'grounded in real signals', color: CYAN, glyph: '↗' },
];

const ScenePattern: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center', marginBottom: 38 }}>
        <Eyebrow text="The pattern" color={CYAN} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.15 }}>
          Three things, every cycle.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        {PATTERN_TILES.map((t, i) => {
          const start = [40, 78, 118][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140, mass: 0.85 } });
          return (
            <div
              key={t.verb}
              style={{
                opacity: op,
                transform: `scale(${sc})`,
                width: 420,
                padding: '40px 32px',
                borderRadius: 22,
                background: 'rgba(255,255,255,0.04)',
                border: `2px solid ${t.color}66`,
                boxShadow: `0 24px 60px ${t.color}22, inset 0 0 30px ${t.color}10`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 56, color: t.color, fontWeight: 900, lineHeight: 1, marginBottom: 18, filter: `drop-shadow(0 0 18px ${t.color}77)`, fontFamily: MONO }}>{t.glyph}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'white', marginBottom: 10, letterSpacing: -0.5 }}>{t.verb}</div>
              <div style={{ fontSize: 20, color: WHITE_70, fontWeight: 500, fontFamily: MONO }}>{t.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 5 · Live on Tara — three real catches together
// ─────────────────────────────────────────────────────────────────────────

interface FindingRow {
  severity: 'P1' | 'P2' | 'P3';
  severityColor: string;
  title: string;
  signal: string;
  outcome: string;
  outcomeColor: string;
  delay: number;
}

const FINDINGS: FindingRow[] = [
  {
    severity: 'P1',
    severityColor: PINK,
    title: 'JIRA webhook — recurring 500s',
    signal: 'fp_8484abd60d9d06a6',
    outcome: 'Backoff retry queued',
    outcomeColor: GREEN,
    delay: 60,
  },
  {
    severity: 'P2',
    severityColor: AMBER,
    title: 'search_all_streams — 60s timeout',
    signal: 'trace_stall_8m',
    outcome: 'Pagination queued',
    outcomeColor: GREEN,
    delay: 90,
  },
  {
    severity: 'P2',
    severityColor: AMBER,
    title: 'Read tool — 25k token blowups',
    signal: 'pattern_token_burn',
    outcome: 'Auto-chunking in progress',
    outcomeColor: GREEN,
    delay: 120,
  },
];

const SceneLiveTara: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const cardOp = interpolate(frame, [30, 56], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outcomeOp = interpolate(frame, [170, 200], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outcomeScale = spring({ frame: frame - 170, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Eyebrow text="Live today · on Tara" color={GREEN} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <TaraAvatar size={120} />
          <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, letterSpacing: -1 }}>
            Three real catches.
          </div>
        </div>
      </div>
      <div style={{ opacity: cardOp, transform: `scale(${cardScale})`, width: 1500, background: 'rgba(7,12,30,0.8)', border: `1px solid ${CYAN}55`, borderRadius: 22, padding: '28px 36px', boxShadow: `0 30px 80px ${CYAN}22` }}>
        {/* Card header — sensor-report-style */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: CYAN, letterSpacing: 4, fontWeight: 700 }}>:: SENSORS REPORT</div>
          <div style={{ fontFamily: MONO, fontSize: 16, color: WHITE_70 }}>3 findings · last cycle</div>
        </div>
        {/* Findings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FINDINGS.map((f, i) => {
            const op = interpolate(frame, [f.delay, f.delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const x = interpolate(frame, [f.delay, f.delay + 22], [-30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: op, transform: `translateX(${x}px)`, display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderLeft: `4px solid ${f.severityColor}` }}>
                <div style={{ padding: '4px 12px', borderRadius: 8, background: `${f.severityColor}22`, border: `1px solid ${f.severityColor}`, fontFamily: MONO, fontSize: 14, fontWeight: 800, color: f.severityColor, letterSpacing: 2, minWidth: 36, textAlign: 'center' }}>{f.severity}</div>
                <div style={{ flex: 1, fontSize: 26, fontWeight: 700, color: WHITE_95, letterSpacing: -0.3 }}>{f.title}</div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: WHITE_70, minWidth: 220 }}>{f.signal}</div>
                <div style={{ padding: '6px 14px', borderRadius: 999, background: `${f.outcomeColor}1A`, border: `1px solid ${f.outcomeColor}88`, fontSize: 16, fontWeight: 700, color: f.outcomeColor, minWidth: 240, textAlign: 'center' }}>{f.outcome}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 26, opacity: outcomeOp, transform: `scale(${outcomeScale})`, padding: '16px 36px', borderRadius: 999, background: `linear-gradient(135deg, ${GREEN}, ${SKY})`, fontSize: 28, fontWeight: 800, color: NAVY_DEEP, boxShadow: `0 20px 50px ${GREEN}55` }}>
        ✓ All caught before the alert fired
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 8 · Multi-app — Tara live + Dashboard, UPI, Breeze next
// ─────────────────────────────────────────────────────────────────────────

interface AppCard { name: string; sub: string; color: string; status: 'live' | 'next'; statusLabel: string; }

const APPS: AppCard[] = [
  { name: 'Tara', sub: 'AI coding agent', color: CYAN, status: 'live', statusLabel: 'LIVE' },
  { name: 'Dashboard', sub: 'merchant control plane', color: GREEN, status: 'next', statusLabel: 'NEXT' },
  { name: 'UPI', sub: 'real-time payments', color: AMBER, status: 'next', statusLabel: 'NEXT' },
  { name: 'Breeze', sub: 'AI growth sidekick', color: PINK, status: 'next', statusLabel: 'NEXT' },
];

const SceneMultiApp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 32 }}>
        <Eyebrow text="And this is just the beginning" color={AMBER} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.1 }}>
          One engine, <span style={{ color: AMBER }}>per product</span>.
        </div>
        <div style={{ marginTop: 14, fontSize: 24, fontWeight: 500, color: WHITE_70, fontStyle: 'italic' }}>
          observability, brought closer to every application we build.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {APPS.map((a, i) => {
          const start = 60 + i * 18;
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140, mass: 0.85 } });
          const isLive = a.status === 'live';
          return (
            <div
              key={a.name}
              style={{
                opacity: op,
                transform: `scale(${sc})`,
                width: 360,
                padding: '36px 28px',
                borderRadius: 22,
                background: isLive ? `${a.color}1A` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${a.color}${isLive ? '' : '66'}`,
                boxShadow: isLive ? `0 24px 60px ${a.color}55, inset 0 0 40px ${a.color}22` : `0 20px 50px ${a.color}22`,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 12px', borderRadius: 999, background: isLive ? GREEN : 'rgba(255,255,255,0.1)', border: isLive ? `1px solid ${GREEN}` : '1px solid rgba(255,255,255,0.25)', fontFamily: MONO, fontSize: 14, fontWeight: 800, color: isLive ? NAVY_DEEP : WHITE_70, letterSpacing: 2 }}>{a.statusLabel}</div>
              <div style={{ width: 84, height: 84, borderRadius: 20, background: `${a.color}22`, border: `2px solid ${a.color}`, margin: '8px auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 38, fontWeight: 900, color: a.color, filter: `drop-shadow(0 0 18px ${a.color}66)` }}>
                {a.name.slice(0, 1)}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: -0.5, marginBottom: 6 }}>{a.name}</div>
              <div style={{ fontSize: 18, color: WHITE_70, fontWeight: 500, fontFamily: MONO }}>{a.sub}</div>
              <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 13, color: a.color, letterSpacing: 2, opacity: 0.85 }}>:: sensors {isLive ? 'running' : 'queued'}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 6 · Self-fixing — autonomous research threads
// ─────────────────────────────────────────────────────────────────────────

const SceneSelfFixing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const sourceScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const sourceOp = interpolate(frame, [20, 42], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const threads = [
    { label: 'investigate', sub: '/research/jira-500s', color: CYAN, delay: 56 },
    { label: 'investigate', sub: '/research/read-token-burn', color: AMBER, delay: 80 },
    { label: 'file ticket', sub: '/file/sa-pagination', color: VIOLET, delay: 104 },
    { label: 'open PR', sub: '/pr/jira-backoff', color: GREEN, delay: 128 },
  ];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 36 }}>
        <Eyebrow text="What's next" color={VIOLET} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.1 }}>
          Sensors stops just <span style={{ color: VIOLET, textDecoration: 'line-through', textDecorationColor: PINK, textDecorationThickness: 3 }}>reporting</span>.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Source: Sensors */}
        <div style={{ opacity: sourceOp, transform: `scale(${sourceScale})`, width: 280, padding: '24px', borderRadius: 18, background: 'rgba(34,211,238,0.10)', border: `2px solid ${CYAN}`, textAlign: 'center', boxShadow: `0 24px 60px ${CYAN}55` }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: CYAN, letterSpacing: 4, marginBottom: 8 }}>SENSORS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: -0.5, marginBottom: 4 }}>cycle</div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: WHITE_70 }}>finding identified</div>
        </div>
        {/* Branching threads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {threads.map((t, i) => {
            const op = interpolate(frame, [t.delay, t.delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const x = interpolate(frame, [t.delay, t.delay + 22], [-30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: op, transform: `translateX(${x}px)`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 70, height: 2, background: t.color, boxShadow: `0 0 12px ${t.color}` }} />
                <div style={{ minWidth: 720, padding: '14px 22px', borderRadius: 12, background: `${t.color}10`, border: `1px solid ${t.color}66`, display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ padding: '4px 12px', borderRadius: 6, background: `${t.color}33`, border: `1px solid ${t.color}`, fontFamily: MONO, fontSize: 14, fontWeight: 800, color: t.color, letterSpacing: 2, textTransform: 'uppercase' }}>{t.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: WHITE_95 }}>{t.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 30, fontSize: 24, fontWeight: 600, color: WHITE_85, fontStyle: 'italic' }}>
        It opens its own threads. Files its own work.
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 7 · Standalone product — Sensors as a separate product
// ─────────────────────────────────────────────────────────────────────────

const SceneProduct: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 30, fps, config: { damping: 13, stiffness: 130, mass: 0.85 } });
  const cardOp = interpolate(frame, [30, 60], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOp = interpolate(frame, [40, 60], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const features = [
    { label: 'runtime intelligence', color: CYAN, delay: 60 },
    { label: 'ranked recommendations', color: AMBER, delay: 76 },
    { label: 'real-evidence grounded', color: GREEN, delay: 92 },
    { label: 'plugs into any stack', color: VIOLET, delay: 108 },
  ];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 32 }}>
        <Eyebrow text="And one more thing" color={AMBER} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.1, maxWidth: 1500 }}>
          The engine itself <span style={{ color: AMBER }}>becomes a product</span>.
        </div>
      </div>
      <div style={{ opacity: cardOp, transform: `scale(${cardScale})`, padding: '40px 60px', borderRadius: 28, background: `linear-gradient(135deg, ${NAVY_MID} 0%, ${INDIGO} 100%)`, border: `2px solid ${AMBER}88`, boxShadow: `0 30px 80px ${AMBER}44, inset 0 0 50px ${AMBER}11`, textAlign: 'center', minWidth: 1100 }}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: AMBER, letterSpacing: 6, marginBottom: 14 }}>STANDALONE</div>
        <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1, background: `linear-gradient(135deg, ${AMBER}, ${PINK})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 10px 40px ${AMBER}55)` }}>SENSORS</div>
        <div style={{ marginTop: 14, fontSize: 24, fontWeight: 600, color: WHITE_85, fontStyle: 'italic' }}>not just internal tooling — something we ship.</div>
      </div>
      <div style={{ marginTop: 30, opacity: labelOp, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1500 }}>
        {features.map((f, i) => {
          const op = interpolate(frame, [f.delay, f.delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - f.delay, fps, config: { damping: 12, stiffness: 150, mass: 0.7 } });
          return (
            <div key={i} style={{ opacity: op, transform: `scale(${sc})`, padding: '12px 24px', borderRadius: 999, background: `${f.color}1A`, border: `2px solid ${f.color}99`, fontSize: 22, fontWeight: 700, color: 'white', fontFamily }}>
              {f.label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 8 · Vision — software that works on itself
// ─────────────────────────────────────────────────────────────────────────

const SceneVision: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lines = [
    { text: 'Every app.', color: GREEN, delay: 14 },
    { text: 'Every cycle.', color: CYAN, delay: 50 },
    { text: 'Working on itself.', color: AMBER, delay: 86 },
  ];
  const closeOp = interpolate(frame, [130, 158], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const closeY = interpolate(frame, [130, 158], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <SensorsWatermark />
      <div style={{ opacity: headOp, marginBottom: 32, textAlign: 'center' }}>
        <Eyebrow text="The vision" color={VIOLET} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
        {lines.map((l, i) => {
          const op = interpolate(frame, [l.delay, l.delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(frame, [l.delay, l.delay + 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, fontSize: 80, fontWeight: 900, color: l.color, letterSpacing: -2, lineHeight: 1.1, filter: `drop-shadow(0 0 24px ${l.color}55)` }}>
              {l.text}
            </div>
          );
        })}
      </div>
      <div style={{ opacity: closeOp, transform: `translateY(${closeY}px)`, marginTop: 36, fontSize: 30, fontWeight: 600, color: WHITE_85, maxWidth: 1300, textAlign: 'center', lineHeight: 1.4 }}>
        Software that <span style={{ color: CYAN, fontWeight: 800 }}>improves itself</span>, cycle by cycle.
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Scene 9 · Outro — Build What Matters
// ─────────────────────────────────────────────────────────────────────────

const TerminalCard: React.FC<{ text: string; revealFrames: number; startFrame?: number }> = ({ text, revealFrames, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const charsRevealed = Math.min(text.length, Math.max(0, Math.floor((localFrame / revealFrames) * text.length)));
  const shown = text.slice(0, charsRevealed);
  const cursorOn = Math.floor(frame / 10) % 2 === 0;
  return (
    <div
      style={{
        background: 'rgba(7, 12, 30, 0.95)',
        border: `1px solid ${CYAN}66`,
        borderRadius: 16,
        padding: '26px 36px',
        fontFamily: MONO,
        fontSize: 32,
        fontWeight: 700,
        color: WHITE_95,
        boxShadow: `0 30px 80px ${CYAN}33, inset 0 0 40px rgba(34,211,238,0.06)`,
        minWidth: 760,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
      </div>
      <div style={{ marginLeft: 16, color: WHITE_95 }}>
        {shown}
        <span style={{ display: 'inline-block', width: 14, height: 28, background: cursorOn ? CYAN : 'transparent', verticalAlign: 'text-bottom', marginLeft: 4, transform: 'translateY(2px)' }} />
      </div>
    </div>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 130, mass: 0.8 } });
  const preOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const heroOp = interpolate(frame, [22, 48], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const heroY = interpolate(frame, [22, 48], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: frame - 50, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });
  const poweredOp = interpolate(frame, [60, 80], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center' }}>
      <div style={{ transform: `scale(${logoScale})` }}><TaraAvatar size={180} /></div>
      <div style={{ marginTop: 26, opacity: preOp, fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textTransform: 'uppercase' }}>Try it in #tara-dev</div>
      <div style={{ marginTop: 14, opacity: heroOp, transform: `translateY(${heroY}px)`, fontSize: 110, fontWeight: 800, letterSpacing: -3, lineHeight: 1, background: `linear-gradient(135deg, ${AMBER}, ${PINK} 60%, ${GREEN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 10px 40px rgba(245,158,11,0.3))' }}>Build What Matters</div>
      <div style={{ marginTop: 26, display: 'flex', gap: 20 }}>
        <div style={{ transform: `scale(${ctaScale})`, padding: '16px 34px', borderRadius: 999, background: `linear-gradient(135deg, ${GREEN}, ${SKY})`, fontSize: 28, fontWeight: 800, color: NAVY_DEEP, boxShadow: `0 20px 50px ${GREEN}55` }}>#tara-dev</div>
        <div style={{ transform: `scale(${ctaScale})`, padding: '16px 34px', borderRadius: 999, background: `linear-gradient(135deg, ${AMBER}, ${PINK})`, fontSize: 28, fontWeight: 800, color: 'white', boxShadow: `0 20px 50px ${PINK}55` }}>#tara-playground</div>
      </div>
      <div style={{ marginTop: 28, opacity: poweredOp, fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: 2 }}>POWERED BY <span style={{ color: AMBER, fontWeight: 800 }}>NEUROLINK</span></div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──────────────────────────────────────────────────────

export interface TaraSensorsProps {
  sceneFrames: number[];
}

const VO = (id: string) => staticFile(`voiceover/tara-sensors/${id}.mp3`);

const TaraSensorsVideo: React.FC<TaraSensorsProps> = ({ sceneFrames }) => {
  const [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10] = sceneFrames;
  return (
    <AbsoluteFill>
      <Background />
      <FloatingNeurons />
      <BackgroundMusic />
      <Series>
        <Series.Sequence durationInFrames={f1} name="Hook"><SceneHook /><Audio src={VO('01-hook')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f2} name="Intro"><SceneIntro /><Audio src={VO('02-intro')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f3} name="Inversion"><SceneInversion /><Audio src={VO('03-inversion')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f4} name="Pattern"><ScenePattern /><Audio src={VO('04-pattern')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f5} name="LiveTara"><SceneLiveTara /><Audio src={VO('05-live-tara')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f6} name="SelfFixing"><SceneSelfFixing /><Audio src={VO('06-self-fixing')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f7} name="Product"><SceneProduct /><Audio src={VO('07-product')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f8} name="MultiApp"><SceneMultiApp /><Audio src={VO('08-multi-app')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f9} name="Vision"><SceneVision /><Audio src={VO('09-vision')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f10} name="Outro"><SceneOutro /><Audio src={VO('10-outro')} volume={1.0} /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default TaraSensorsVideo;

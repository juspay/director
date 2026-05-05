/**
 * @reference-scene HippocampusComposition (YC-pitch revision)
 * @origin Hippocampus SDK YC-pitch announcement — revised 2026-04-28
 * @demonstrates 10-scene pitch video with kinetic counter reveal, terminal outro,
 *   parallax aurora background, heavy typography, cyan-dominant palette.
 *
 * Audio assets (generated via scripts/generate-voiceover.mjs hippocampus + generate-music.mjs hippocampus):
 *   public/voiceover/hippocampus/01-title.mp3 … 12-outro.mp3
 *   public/voiceover/hippocampus/music-01.mp3
 *
 * Image asset:
 *   public/hippocampus-icon.png
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

// ── Palette (matches the icon) ────────────────────────────────────────────

const NAVY_DEEP = '#070C1E';
const NAVY = '#0B1226';
const NAVY_MID = '#141B3A';
const INDIGO = '#1E1B4B';
const CYAN = '#22D3EE';
const CYAN_DEEP = '#06B6D4';
const AMBER = '#F59E0B';
const PINK = '#F472B6';
const GREEN = '#34D399';
const VIOLET = '#A78BFA';
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
  const BASE = 0.07;
  const volume = (f: number) => {
    if (f < fadeFrames) return (f / fadeFrames) * BASE;
    if (f > durationInFrames - fadeFrames)
      return Math.max(0, ((durationInFrames - f) / fadeFrames) * BASE);
    return BASE;
  };
  return (
    <Audio src={staticFile('voiceover/hippocampus/music-01.mp3')} volume={volume} loop />
  );
};

// ── Logo (the provided icon) ─────────────────────────────────────────────

const Logo: React.FC<{ size?: number; pulse?: boolean }> = ({ size = 320, pulse = true }) => {
  const frame = useCurrentFrame();
  const p = pulse ? 1 + Math.sin((frame / 30) * 2 * Math.PI) * 0.025 : 1;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        transform: `scale(${p})`,
        filter: `drop-shadow(0 0 ${size * 0.18}px ${CYAN}88) drop-shadow(0 30px 60px rgba(0,0,0,0.45))`,
      }}
    >
      <Img
        src={staticFile('hippocampus-icon.png')}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

const CornerWatermark: React.FC = () => (
  <div style={{ position: 'absolute', top: 38, left: 48, display: 'flex', alignItems: 'center', gap: 14, zIndex: 10 }}>
    <div style={{ width: 38, height: 38 }}>
      <Img src={staticFile('hippocampus-icon.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <div style={{ fontFamily, color: WHITE_85, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>Hippocampus</div>
  </div>
);

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
      }}
    >
      <span style={{ width: 28, height: 2, background: color }} />
      {text}
    </div>
  );
};

// ── Scene 1 · Hook ────────────────────────────────────────────────────────

const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 13, stiffness: 110, mass: 0.85 } });
  const logoOp = interpolate(frame, [0, 14], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line1Op = interpolate(frame, [22, 44], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line1Y = interpolate(frame, [22, 44], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line2Op = interpolate(frame, [130, 158], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const line2Y = interpolate(frame, [130, 158], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const taglineScale = spring({ frame: frame - 170, fps, config: { damping: 11, stiffness: 130, mass: 0.7 } });
  const taglineOp = interpolate(frame, [170, 195], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 195, fps, config: { damping: 11, stiffness: 130, mass: 0.7 } });
  const cardOp = interpolate(frame, [195, 215], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: 36 }}>
        <Logo size={300} />
      </div>
      <div style={{ opacity: line1Op, transform: `translateY(${line1Y}px)`, fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.15, maxWidth: 1500, color: WHITE_95 }}>
        Today's AI has a <span style={{ color: AMBER }}>genius brain</span>{' '}
        <br />
        and a <span style={{ color: PINK }}>goldfish memory</span>.
      </div>
      <div style={{ opacity: line2Op, transform: `translateY(${line2Y}px)`, fontSize: 88, fontWeight: 900, letterSpacing: -2, marginTop: 24, background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Hippocampus is the fix.
      </div>
      <div style={{ marginTop: 22, opacity: taglineOp, transform: `scale(${taglineScale})`, fontSize: 30, fontWeight: 600, color: WHITE_85, letterSpacing: 0.5, fontStyle: 'italic' }}>
        Condensed memory for AI agents.
      </div>
      <div style={{ marginTop: 24, opacity: cardOp, transform: `scale(${cardScale})`, padding: '10px 24px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${CYAN}55`, borderRadius: 999, fontSize: 18, fontWeight: 700, color: CYAN, fontFamily: MONO, letterSpacing: 1 }}>
        @juspay/hippocampus
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2 · The problem (bullet-dot stack) ─────────────────────────────

const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const bullets = [
    { text: 'Vectors pile up', color: PINK },
    { text: 'Retrieval gets noisier', color: AMBER },
    { text: 'The model still misses what matters', color: CYAN },
  ];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center', marginBottom: 50 }}>
        <Eyebrow text="The problem" color={PINK} />
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.15, color: WHITE_95, maxWidth: 1500 }}>
          Most memory layers <span style={{ color: PINK }}>grow without limit</span>.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
        {bullets.map((b, i) => {
          const start = [60, 90, 130][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const x = interpolate(frame, [start, start + 24], [-40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: op, transform: `translateX(${x}px)`, fontSize: 42, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 22 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: b.color, boxShadow: `0 0 24px ${b.color}` }} />
              <span style={{ color: WHITE_95 }}>{b.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3 · The new path ───────────────────────────────────────────────

const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardOp = interpolate(frame, [105, 135], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const negOp = interpolate(frame, [165, 200], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center', marginBottom: 32 }}>
        <Eyebrow text="A different path" color={CYAN} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.15, maxWidth: 1500 }}>
          One memory string per user.
        </div>
      </div>
      <div style={{ opacity: cardOp, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ padding: '24px 36px', borderRadius: 16, background: 'rgba(34,211,238,0.10)', border: `2px solid ${CYAN}88`, fontSize: 30, fontWeight: 700, color: CYAN, fontFamily: MONO, boxShadow: `0 20px 50px ${CYAN}33` }}>
          your model writes
        </div>
        <div style={{ fontSize: 36, color: WHITE_70 }}>↔</div>
        <div style={{ padding: '24px 36px', borderRadius: 16, background: 'rgba(167,139,250,0.10)', border: `2px solid ${VIOLET}88`, fontSize: 30, fontWeight: 700, color: VIOLET, fontFamily: MONO, boxShadow: `0 20px 50px ${VIOLET}33` }}>
          your model reads
        </div>
      </div>
      <div style={{ marginTop: 38, opacity: negOp, display: 'flex', gap: 18 }}>
        <div style={{ padding: '12px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', fontSize: 24, fontWeight: 600, color: WHITE_70, fontFamily: MONO, textDecoration: 'line-through', textDecorationColor: PINK, textDecorationThickness: 3 }}>
          no vectors
        </div>
        <div style={{ padding: '12px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', fontSize: 24, fontWeight: 600, color: WHITE_70, fontFamily: MONO, textDecoration: 'line-through', textDecorationColor: PINK, textDecorationThickness: 3 }}>
          no pipelines
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4 · Learns + Personalizes ──────────────────────────────────────

const LEARN_TILES = [
  { label: 'Preferences', sub: 'how they like to talk', color: CYAN, icon: '↗' },
  { label: 'Context', sub: "what they're working on", color: AMBER, icon: '↗' },
  { label: 'Goals', sub: 'where they’re heading', color: PINK, icon: '↗' },
];

const SceneLearning: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const closeOp = interpolate(frame, [240, 268], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const closeY = interpolate(frame, [240, 268], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center', marginBottom: 36 }}>
        <Eyebrow text="Learns · Personalizes" color={CYAN} />
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, color: WHITE_95, maxWidth: 1500 }}>
          Every conversation makes it <span style={{ color: CYAN }}>smarter</span>.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 28, marginBottom: 26 }}>
        {LEARN_TILES.map((t, i) => {
          const start = [100, 150, 175][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140, mass: 0.85 } });
          return (
            <div
              key={t.label}
              style={{
                opacity: op,
                transform: `scale(${sc})`,
                width: 360,
                padding: '32px 28px',
                borderRadius: 22,
                background: 'rgba(255,255,255,0.04)',
                border: `2px solid ${t.color}66`,
                boxShadow: `0 24px 60px ${t.color}22, inset 0 0 30px ${t.color}10`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 900, color: t.color, lineHeight: 1, marginBottom: 14, filter: `drop-shadow(0 0 18px ${t.color}77)`, fontFamily: MONO }}>{t.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: -0.5 }}>{t.label}</div>
              <div style={{ fontSize: 18, color: WHITE_70, fontWeight: 500, fontFamily: MONO }}>{t.sub}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          opacity: closeOp,
          transform: `translateY(${closeY}px)`,
          marginTop: 18,
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: -0.5,
          background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Stops repeating. Starts learning.
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5 · API ─────────────────────────────────────────────────────────

const API_METHODS = [
  { sig: 'memory.add', desc: 'merge new content', color: GREEN },
  { sig: 'memory.get', desc: 'read condensed memory', color: CYAN },
  { sig: 'memory.delete', desc: 'remove for owner', color: PINK },
  { sig: 'memory.close', desc: 'release resources', color: AMBER },
];

const SceneApi: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 36 }}>
        <Eyebrow text="The entire SDK" color={GREEN} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95, lineHeight: 1.1 }}>
          Four methods.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {API_METHODS.map((m, i) => {
          const start = [35, 55, 75, 95][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const x = interpolate(frame, [start, start + 26], [-32, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={m.sig} style={{ opacity: op, transform: `translateX(${x}px)`, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderLeft: `4px solid ${m.color}`, borderRadius: 14, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 26, width: 540 }}>
              <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: m.color, minWidth: 240 }}>{m.sig}()</div>
              <div style={{ fontSize: 20, color: WHITE_70, fontWeight: 500 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5 · Storage (brand-mark SVGs) ──────────────────────────────────

// Approximations of the official brand marks, sized to fit ~110×110 frames.

const SqliteIcon: React.FC<{ size: number }> = ({ size }) => (
  // Stylized feather + cylinder (SQLite vibe)
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="sql-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0F80CC" />
        <stop offset="1" stopColor="#003B57" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="22" rx="32" ry="9" fill="url(#sql-grad)" />
    <path d="M 18 22 V 70 Q 18 80 50 80 Q 82 80 82 70 V 22" fill="none" stroke="url(#sql-grad)" strokeWidth="6" />
    <ellipse cx="50" cy="46" rx="32" ry="9" fill="none" stroke="url(#sql-grad)" strokeWidth="3" opacity="0.6" />
    <path d="M 30 40 Q 50 60 70 50 Q 80 45 78 35" fill="none" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const RedisIcon: React.FC<{ size: number }> = ({ size }) => (
  // Stacked-cube glyph (Redis cube)
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="redis-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A41E11" />
        <stop offset="1" stopColor="#DC382D" />
      </linearGradient>
    </defs>
    <polygon points="50,10 88,28 50,46 12,28" fill="url(#redis-grad)" />
    <polygon points="50,46 88,28 88,52 50,70" fill="#7A1810" opacity="0.85" />
    <polygon points="50,46 12,28 12,52 50,70" fill="#C42B1F" />
    <polygon points="50,70 88,52 88,76 50,94" fill="#7A1810" opacity="0.85" />
    <polygon points="50,70 12,52 12,76 50,94" fill="#C42B1F" />
    <polyline points="12,28 50,46 88,28" fill="none" stroke="#FFCFCB" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const S3Icon: React.FC<{ size: number }> = ({ size }) => (
  // AWS S3 bucket
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="s3-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F8A23E" />
        <stop offset="1" stopColor="#E25A1C" />
      </linearGradient>
    </defs>
    <path d="M 18 30 L 30 88 H 70 L 82 30 Z" fill="url(#s3-grad)" />
    <ellipse cx="50" cy="30" rx="32" ry="8" fill="#F8A23E" />
    <ellipse cx="50" cy="30" rx="32" ry="8" fill="none" stroke="#A23906" strokeWidth="1.5" />
    <text x="50" y="68" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900">S3</text>
  </svg>
);

const CustomIcon: React.FC<{ size: number }> = ({ size }) => (
  // Code-bracket glyph </>
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="custom-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22D3EE" />
        <stop offset="1" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <rect x="6" y="14" width="88" height="72" rx="14" fill="none" stroke="url(#custom-grad)" strokeWidth="4" />
    <path d="M 30 38 L 18 50 L 30 62" fill="none" stroke="url(#custom-grad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 70 38 L 82 50 L 70 62" fill="none" stroke="url(#custom-grad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="58" y1="32" x2="42" y2="68" stroke="url(#custom-grad)" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const STORAGE = [
  { label: 'SQLite', Icon: SqliteIcon, color: '#3FA9DC', accent: '#003B57' },
  { label: 'Redis', Icon: RedisIcon, color: '#DC382D', accent: '#A41E11' },
  { label: 'S3', Icon: S3Icon, color: '#E25A1C', accent: '#F8A23E' },
  { label: 'Custom', Icon: CustomIcon, color: CYAN, accent: '#0891B2' },
];

const SceneStorage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 36 }}>
        <Eyebrow text="Storage" color={AMBER} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95 }}>
          Drops in anywhere.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
        {STORAGE.map((s, i) => {
          const start = [45, 60, 75, 90][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140, mass: 0.85 } });
          const Icon = s.Icon;
          return (
            <div
              key={s.label}
              style={{
                opacity: op,
                transform: `scale(${sc})`,
                width: 270,
                height: 290,
                padding: 28,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.04)',
                border: `2px solid ${s.color}66`,
                boxShadow: `0 24px 60px ${s.color}22, inset 0 0 30px ${s.color}10`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: 22, filter: `drop-shadow(0 6px 20px ${s.color}66)` }}>
                <Icon size={120} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 6 · Models ─────────────────────────────────────────────────────

const PROVIDERS = [
  { label: 'OpenAI', color: GREEN },
  { label: 'Gemini', color: CYAN },
  { label: 'Claude', color: AMBER },
  { label: 'Bedrock', color: PINK },
  { label: 'Vertex', color: VIOLET },
  { label: 'Azure', color: '#7DD3FC' },
  { label: 'LiteLLM', color: '#FB923C' },
  { label: 'Ollama', color: GREEN },
];

const Chip: React.FC<{ label: string; color: string; delay: number }> = ({ label, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 150, mass: 0.7 } });
  return (
    <div style={{ transform: `scale(${s})`, padding: '14px 30px', borderRadius: 999, background: `${color}1A`, border: `2px solid ${color}99`, color: 'white', fontSize: 28, fontWeight: 700, fontFamily, boxShadow: `0 10px 28px ${color}33` }}>
      {label}
    </div>
  );
};

const SceneModels: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 32 }}>
        <Eyebrow text="Any model" color={CYAN} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WHITE_95 }}>Powered by NeuroLink.</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, maxWidth: 1300, justifyContent: 'center' }}>
        {PROVIDERS.map((p, i) => (
          <Chip key={p.label} label={p.label} color={p.color} delay={26 + i * 7} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 7 · The proof — kinetic counters ───────────────────────────────

const KineticCounter: React.FC<{
  target: number;
  suffix: string;
  label: string;
  sub: string;
  color: string;
  startFrame: number;
  durationFrames: number;
  big?: boolean;
}> = ({ target, suffix, label, sub, color, startFrame, durationFrames, big }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const value = Math.round(target * t);
  const popScale = spring({
    frame: frame - (startFrame + durationFrames),
    fps,
    config: { damping: 8, stiffness: 220, mass: 0.6 },
  });
  const pop = 1 + popScale * 0.05;
  const op = interpolate(frame, [startFrame - 4, startFrame + 6], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lit = t >= 1;
  const numberSize = big ? 132 : 96;
  return (
    <div
      style={{
        opacity: op,
        transform: `scale(${pop})`,
        flex: 1,
        padding: big ? '36px 28px' : '28px 22px',
        borderRadius: 22,
        background: lit ? `${color}1A` : 'rgba(255,255,255,0.03)',
        border: `2px solid ${lit ? color : 'rgba(255,255,255,0.15)'}`,
        boxShadow: lit ? `0 20px 60px ${color}55, inset 0 0 40px ${color}22` : 'none',
        textAlign: 'center',
        transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: numberSize, fontWeight: 900, color: lit ? color : WHITE_85, lineHeight: 1, letterSpacing: -3, marginBottom: 10, filter: lit ? `drop-shadow(0 0 24px ${color}88)` : 'none' }}>
        {value}
        <span style={{ fontSize: numberSize * 0.55, marginLeft: 4 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: big ? 24 : 20, fontWeight: 800, color: WHITE_95, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: big ? 18 : 16, color: WHITE_70, fontWeight: 500, fontFamily: MONO }}>{sub}</div>
    </div>
  );
};

const SceneLocomo: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [10, 30], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Counters land on the spoken number. VO timing across 15.36s scene:
  //   ~3.3s "ninety-five percent on adversarial"  → frame 100
  //   ~7.7s "seventy-eight percent single-hop"    → frame 230
  //   ~9.7s "sixty-five percent overall"          → frame 290
  //   ~12s  "thirty times smaller than the source"→ frame 360
  const COUNT_DUR = 22;
  const start1 = 100;
  const start2 = 230;
  const start3 = 290;
  const start4 = 360;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 8 }}>
        <Eyebrow text="The proof" color={AMBER} />
        <div style={{ fontSize: 56, fontWeight: 800, color: WHITE_95, lineHeight: 1.1 }}>
          Benchmarked on <span style={{ color: AMBER }}>LoCoMo</span>.
        </div>
      </div>
      <div style={{ opacity: subOp, fontSize: 22, color: WHITE_70, fontWeight: 500, marginBottom: 36, fontFamily: MONO }}>
        snap-research/locomo · 1,986 QA pairs · long-conversation memory benchmark
      </div>
      <div style={{ display: 'flex', gap: 36, width: 1620, alignItems: 'stretch' }}>
        <KineticCounter target={95} suffix="%" label="Adversarial" sub="knows when it doesn't know" color={GREEN} startFrame={start1} durationFrames={COUNT_DUR} big />
        <KineticCounter target={78} suffix="%" label="Single-hop recall" sub="direct fact retention" color={CYAN} startFrame={start2} durationFrames={COUNT_DUR} />
        <KineticCounter target={65} suffix="%" label="Overall accuracy" sub="across 5 categories" color={AMBER} startFrame={start3} durationFrames={COUNT_DUR} />
        <KineticCounter target={30} suffix="×" label="Compression" sub="vs raw conversation" color={PINK} startFrame={start4} durationFrames={COUNT_DUR} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 8 · Moat ───────────────────────────────────────────────────────

const SceneMoat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftScale = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const rightScale = spring({ frame: frame - 90, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const arrowOp = interpolate(frame, [70, 90], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, textAlign: 'center', marginBottom: 38 }}>
        <Eyebrow text="The moat" color={VIOLET} />
        <div style={{ fontSize: 56, fontWeight: 800, color: WHITE_95 }}>
          Five thousand turns. <span style={{ color: CYAN }}>One prompt.</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ transform: `scale(${leftScale})`, width: 460, padding: '32px 28px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(244,114,182,0.5)', textAlign: 'center', boxShadow: '0 20px 60px rgba(244,114,182,0.18)' }}>
          <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 900, color: PINK, letterSpacing: -2, marginBottom: 8 }}>5,800</div>
          <div style={{ fontSize: 22, color: WHITE_70, fontWeight: 600, letterSpacing: 1 }}>turns of dialogue</div>
        </div>
        <div style={{ opacity: arrowOp, fontSize: 60, color: CYAN, fontWeight: 300 }}>→</div>
        <div style={{ transform: `scale(${rightScale})`, width: 460, padding: '32px 28px', borderRadius: 22, background: 'rgba(34,211,238,0.10)', border: `2px solid ${CYAN}`, textAlign: 'center', boxShadow: `0 20px 60px ${CYAN}55` }}>
          <div style={{ fontFamily: MONO, fontSize: 84, fontWeight: 900, color: CYAN, letterSpacing: -2, marginBottom: 8 }}>~2,000</div>
          <div style={{ fontSize: 22, color: WHITE_70, fontWeight: 600, letterSpacing: 1 }}>words · one prompt</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 10 · Used by (production proof) ────────────────────────────────

const PRODUCTS = [
  { name: 'Tara', tagline: 'AI coding agent', img: 'products/tara.png', color: '#3FA9DC' },
  { name: 'Breeze Automatic', tagline: 'AI sidekick for smarter D2C growth', img: 'products/breeze.webp', color: '#F59E0B' },
  { name: 'Yamma', tagline: 'AI-Native Code Review Guardian', img: 'products/yamma.png', color: '#FBBF24' },
];

const SceneUsedBy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: 'center', marginBottom: 40 }}>
        <Eyebrow text="In production" color={GREEN} />
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, color: WHITE_95 }}>
          Already shipping at <span style={{ color: GREEN }}>Juspay</span>.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
        {PRODUCTS.map((p, i) => {
          const start = [65, 90, 115][i];
          const op = interpolate(frame, [start, start + 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sc = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140, mass: 0.85 } });
          return (
            <div
              key={p.name}
              style={{
                opacity: op,
                transform: `scale(${sc})`,
                width: 400,
                padding: '32px 28px',
                borderRadius: 22,
                background: 'rgba(255,255,255,0.04)',
                border: `2px solid ${p.color}66`,
                boxShadow: `0 24px 60px ${p.color}22`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 22,
              }}
            >
              <div style={{ width: 220, height: 220, borderRadius: 18, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                <Img src={staticFile(p.img)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>{p.name}</div>
                <div style={{ fontSize: 18, color: WHITE_70, fontWeight: 500, marginTop: 6, lineHeight: 1.3, maxWidth: 320 }}>{p.tagline}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 11 · Vision ────────────────────────────────────────────────────

const SceneVision: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 22], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lines = [
    { text: 'Every chatbot.', color: GREEN, delay: 0 },
    { text: 'Every agent.', color: CYAN, delay: 30 },
    { text: 'Every AI in your stack.', color: AMBER, delay: 60 },
  ];
  const closeOp = interpolate(frame, [115, 145], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const closeY = interpolate(frame, [115, 145], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <CornerWatermark />
      <div style={{ opacity: headOp, marginBottom: 32, textAlign: 'center' }}>
        <Eyebrow text="The vision" color={VIOLET} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
        {lines.map((l, i) => {
          const op = interpolate(frame, [l.delay, l.delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(frame, [l.delay, l.delay + 22], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, fontSize: 60, fontWeight: 800, color: l.color, letterSpacing: -1.5 }}>
              {l.text}
            </div>
          );
        })}
      </div>
      <div style={{ opacity: closeOp, transform: `translateY(${closeY}px)`, marginTop: 36, fontSize: 32, fontWeight: 600, color: WHITE_85, maxWidth: 1300, textAlign: 'center', lineHeight: 1.4 }}>
        Hippocampus is the <span style={{ color: CYAN, fontWeight: 800 }}>simplest one that actually works</span>.
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 10 · Outro — terminal install card ─────────────────────────────

const TerminalCard: React.FC<{ revealFrames: number; startFrame?: number }> = ({ revealFrames, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const cmd = '$ npm install @juspay/hippocampus';
  const charsRevealed = Math.min(cmd.length, Math.max(0, Math.floor((localFrame / revealFrames) * cmd.length)));
  const text = cmd.slice(0, charsRevealed);
  const cursorOn = Math.floor(frame / 10) % 2 === 0;
  return (
    <div
      style={{
        background: 'rgba(7, 12, 30, 0.95)',
        border: `1px solid ${CYAN}66`,
        borderRadius: 16,
        padding: '26px 36px',
        fontFamily: MONO,
        fontSize: 36,
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
        {text}
        <span style={{ display: 'inline-block', width: 14, height: 28, background: cursorOn ? CYAN : 'transparent', verticalAlign: 'text-bottom', marginLeft: 4, transform: 'translateY(2px)' }} />
      </div>
    </div>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 130, mass: 0.85 } });
  const logoOp = interpolate(frame, [0, 14], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordOp = interpolate(frame, [14, 36], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordY = interpolate(frame, [14, 36], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const byOp = interpolate(frame, [50, 72], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardOp = interpolate(frame, [80, 105], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 80, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <div style={{ opacity: logoOp, transform: `scale(${logoScale})` }}>
        <Logo size={180} />
      </div>
      <div style={{ marginTop: 22, opacity: wordOp, transform: `translateY(${wordY}px)`, fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 1, background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 10px 40px ${CYAN}55)` }}>
        Hippocampus
      </div>
      <div style={{ opacity: byOp, marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, color: WHITE_70 }}>
        <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>by</span>
        <Img src={staticFile('juspay-logo.png')} style={{ height: 48, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(34,211,238,0.35))' }} />
      </div>
      <div style={{ opacity: cardOp, transform: `scale(${cardScale})`, marginTop: 36 }}>
        <TerminalCard revealFrames={36} startFrame={80} />
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──────────────────────────────────────────────────────

export interface HippocampusProps {
  sceneFrames: number[];
}

const VO = (id: string) => staticFile(`voiceover/hippocampus/${id}.mp3`);

const HippocampusVideo: React.FC<HippocampusProps> = ({ sceneFrames }) => {
  const [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12] = sceneFrames;
  return (
    <AbsoluteFill>
      <Background />
      <FloatingNeurons />
      <BackgroundMusic />
      <Series>
        <Series.Sequence durationInFrames={f1} name="Title"><SceneTitle /><Audio src={VO('01-title')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f2} name="Problem"><SceneProblem /><Audio src={VO('02-problem')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f3} name="Solution"><SceneSolution /><Audio src={VO('03-solution')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f4} name="Learning"><SceneLearning /><Audio src={VO('04-learning')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f5} name="Api"><SceneApi /><Audio src={VO('05-api')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f6} name="Storage"><SceneStorage /><Audio src={VO('06-storage')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f7} name="Models"><SceneModels /><Audio src={VO('07-models')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f8} name="Locomo"><SceneLocomo /><Audio src={VO('08-locomo')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f9} name="Moat"><SceneMoat /><Audio src={VO('09-moat')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f10} name="UsedBy"><SceneUsedBy /><Audio src={VO('10-usedby')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f11} name="Vision"><SceneVision /><Audio src={VO('11-vision')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f12} name="Outro"><SceneOutro /><Audio src={VO('12-outro')} volume={1.0} /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default HippocampusVideo;

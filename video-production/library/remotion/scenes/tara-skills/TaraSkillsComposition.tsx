/**
 * @reference-scene TaraSkillsComposition
 * @origin Tara Skills announcement video — contributed 2026-04-16
 * @demonstrates Multi-scene product announcement template with voiceover, background music,
 *   slash-command showcase, approval flow visualization, scoping, example skills, and tagline outro.
 * @dependencies React, remotion (AbsoluteFill, Img, Series, staticFile, useCurrentFrame, useVideoConfig,
 *   interpolate, Easing, spring), @remotion/media (Audio), @remotion/google-fonts/Inter
 *
 * 10-scene layout (1920x1080 @ 30fps):
 *   1. Title — Tara avatar + "Tara has Skills now"
 *   2. What — staggered explainer lines
 *   3. Commands — 4 slash commands with colored left-border rows
 *   4. Flow — run → request → approved → ready pipeline
 *   5. Scope — global vs channel-specific cards
 *   6–8. Examples — parameterized skill cards (ACL Finder, Jira-First, Blend UI)
 *   9. Coming Soon — auto-creation teaser
 *  10. Outro — "Build What Matters" tagline + CTA pills
 *
 * Audio assets (generated at build time, NOT committed):
 *   public/voiceover/01-title.mp3 … 10-outro.mp3  — per-scene voiceover
 *   public/voiceover/music-01.mp3                  — background music (looped)
 *   public/voiceover/durations.json                — audio durations for dynamic scene sizing
 *
 * Run `node scripts/generate-voiceover.mjs` and `node scripts/generate-music.mjs`
 * to populate these before rendering.
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
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

// ── Palette ──────────────────────────────────────────────────────────────

const ROYAL_BLUE = '#1E50E0';
const ROYAL_BLUE_DEEP = '#1640B8';
const ROYAL_BLUE_DARK = '#0F2E80';
const ACCENT = '#FFD24A';
const ACCENT_PINK = '#FF5A7A';
const ACCENT_GREEN = '#4ADE80';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// ── Shared visual layers ─────────────────────────────────────────────────

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(135deg, ${ROYAL_BLUE} 0%, ${ROYAL_BLUE_DEEP} 60%, ${ROYAL_BLUE_DARK} 100%)`,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)',
      }}
    />
  </AbsoluteFill>
);

const FloatingShapes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.25, pointerEvents: 'none' }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const seed = i * 91.7;
        const x = (Math.sin(seed) * 0.5 + 0.5) * 1920;
        const y = (Math.cos(seed * 1.9) * 0.5 + 0.5) * 1080;
        const drift = Math.sin((frame + i * 14) / 36) * 24;
        const size = 8 + (i % 4) * 5;
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
              background: 'white',
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
  const BASE = 0.09;
  const volume = (f: number) => {
    if (f < fadeFrames) return (f / fadeFrames) * BASE;
    if (f > durationInFrames - fadeFrames)
      return Math.max(0, ((durationInFrames - f) / fadeFrames) * BASE);
    return BASE;
  };
  return (
    <Audio src={staticFile('voiceover/music-01.mp3')} volume={volume} loop />
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────

const TaraAvatar: React.FC<{ size?: number }> = ({ size = 220 }) => {
  const cropX = 68;
  const cropY = 18;
  const cropW = 340;
  const scale = size / cropW;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        overflow: 'hidden',
        border: `${Math.max(4, size * 0.025)}px solid white`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        background: ROYAL_BLUE,
        position: 'relative',
      }}
    >
      <Img
        src={staticFile('tara.png')}
        style={{
          position: 'absolute',
          width: 476 * scale,
          height: 468 * scale,
          left: -cropX * scale,
          top: -cropY * scale,
          maxWidth: 'none',
        }}
      />
    </div>
  );
};

// ── Scene 1: Title ────────────────────────────────────────────────────────

const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [15, 35], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [35, 55], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeScale = spring({ frame: frame - 50, fps, config: { damping: 10, stiffness: 140, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center' }}>
      <div style={{ transform: `scale(${logoScale})` }}><TaraAvatar size={260} /></div>
      <div style={{ marginTop: 40, opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
        Tara has{' '}
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_GREEN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Skills</span>{' '}
        now
      </div>
      <div style={{ marginTop: 16, opacity: subOpacity, fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>A new feature for everyone using Tara</div>
      <div style={{ marginTop: 28, transform: `scale(${badgeScale})`, padding: '12px 26px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, fontSize: 24, fontWeight: 700, color: ACCENT }}>✦ NEW</div>
    </AbsoluteFill>
  );
};

// ── Scene 2: What are Skills ──────────────────────────────────────────────

const SceneWhat: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 18], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const lines = [
    'Elaborate steps or instructions',
    'for repetitive tasks you do today.',
    'Create them once — Tara reuses them',
    "whenever they're needed.",
  ];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, fontSize: 40, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 36 }}>What are Skills?</div>
      <div style={{ textAlign: 'center', maxWidth: 1200 }}>
        {lines.map((line, i) => {
          const start = 20 + i * 12;
          const op = interpolate(frame, [start, start + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(frame, [start, start + 18], [24, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, fontSize: 50, fontWeight: 600, lineHeight: 1.35, color: i >= 2 ? 'white' : 'rgba(255,255,255,0.88)' }}>{line}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: Slash Commands ───────────────────────────────────────────────

const COMMANDS = [
  { cmd: '/skill-create', desc: 'Raise a request to create a new skill', color: '#4ADE80' },
  { cmd: '/skill-update', desc: 'Raise a request to update an existing skill', color: '#FFD24A' },
  { cmd: '/skill-list', desc: 'See all the existing skills', color: '#7DD3FC' },
  { cmd: '/skill-delete', desc: 'Raise a request to delete a skill', color: '#FF5A7A' },
];

const SceneCommands: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT_GREEN, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>Slash Commands</div>
      <div style={{ opacity: subOp, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginBottom: 34, textAlign: 'center' }}>Only available inside the #tara-skills channel</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {COMMANDS.map((c, i) => {
          const start = 28 + i * 12;
          const op = interpolate(frame, [start, start + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const x = interpolate(frame, [start, start + 22], [-40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={c.cmd} style={{ opacity: op, transform: `translateX(${x}px)`, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderLeft: `5px solid ${c.color}`, borderRadius: 14, padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 22, width: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 34, fontWeight: 700, color: c.color, minWidth: 320 }}>{c.cmd}</div>
              <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{c.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Approval Flow ────────────────────────────────────────────────

const FlowStep: React.FC<{ label: string; sub: string; color: string; icon: string; delay: number }> = ({ label, sub, color, icon, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130, mass: 0.8 } });
  const op = interpolate(frame, [delay, delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: op, transform: `scale(${s})`, width: 260, padding: '24px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: `2px solid ${color}`, textAlign: 'center', boxShadow: `0 15px 40px ${color}33` }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>{sub}</div>
    </div>
  );
};

const FlowArrow: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ opacity: op, fontSize: 40, color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>→</div>;
};

const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 40 }}>How it works</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <FlowStep label="Run command" sub="/skill-create" color="#4ADE80" icon="⚡" delay={15} />
        <FlowArrow delay={28} />
        <FlowStep label="Request raised" sub="Awaiting review" color="#FFD24A" icon="📝" delay={36} />
        <FlowArrow delay={50} />
        <FlowStep label="Approved" sub="Skill goes live" color="#7DD3FC" icon="✓" delay={58} />
        <FlowArrow delay={72} />
        <FlowStep label="Ready to use" sub="Tara picks it up" color="#FF5A7A" icon="🚀" delay={80} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: Scoping ──────────────────────────────────────────────────────

const SceneScope: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftS = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const rightS = spring({ frame: frame - 36, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const leftOp = interpolate(frame, [22, 42], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightOp = interpolate(frame, [36, 56], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const card = (color: string): React.CSSProperties => ({ width: 480, padding: '38px 40px', borderRadius: 22, background: 'rgba(255,255,255,0.1)', border: `2px solid ${color}`, boxShadow: `0 20px 60px ${color}33`, textAlign: 'center' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT_PINK, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>Skills are scoped</div>
      <div style={{ opacity: subOp, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginBottom: 44, textAlign: 'center' }}>Pick where each skill is available</div>
      <div style={{ display: 'flex', gap: 36 }}>
        <div style={{ ...card('#4ADE80'), opacity: leftOp, transform: `scale(${leftS})` }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🌐</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#4ADE80', marginBottom: 8 }}>Global</div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>Works across every channel</div>
        </div>
        <div style={{ ...card('#FFD24A'), opacity: rightOp, transform: `scale(${rightS})` }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>#</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#FFD24A', marginBottom: 8 }}>Channel-specific</div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>Scoped to one channel only</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scenes 6–8: Parameterized Example ─────────────────────────────────────

const Tag: React.FC<{ label: string; color: string; delay: number }> = ({ label, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140, mass: 0.7 } });
  return (
    <div style={{ transform: `scale(${s})`, padding: '12px 26px', borderRadius: 999, background: `${color}33`, border: `2px solid ${color}`, color: 'white', fontSize: 28, fontWeight: 600, fontFamily }}>
      {label}
    </div>
  );
};

interface ExampleData {
  eyebrow: string;
  title: string;
  icon: string;
  iconGradient: [string, string];
  instructionLines: string[];
  tags: { label: string; color: string }[];
}

const EXAMPLES: ExampleData[] = [
  {
    eyebrow: 'Example 1 of 3', title: 'ACL Finder', icon: '🔍', iconGradient: [ACCENT, ACCENT_GREEN],
    instructionLines: ['Look in the dashboard codebase for ACL definitions,', 'check role mappings and Euler permission flows.'],
    tags: [{ label: 'access', color: ACCENT_GREEN }, { label: 'acl', color: ACCENT }, { label: 'dashboard', color: '#7DD3FC' }, { label: 'euler', color: ACCENT_PINK }],
  },
  {
    eyebrow: 'Example 2 of 3', title: 'Jira-First Coding', icon: '🎫', iconGradient: ['#7DD3FC', ACCENT_GREEN],
    instructionLines: ['Before starting any coding task, first create a Jira ticket', 'in the EXAMPLE project, then begin implementation.'],
    tags: [{ label: 'code', color: ACCENT_GREEN }, { label: 'jira', color: '#7DD3FC' }, { label: 'ticket', color: ACCENT }, { label: 'start-task', color: ACCENT_PINK }],
  },
  {
    eyebrow: 'Example 3 of 3', title: 'Blend UI Components', icon: '🎨', iconGradient: [ACCENT_PINK, ACCENT],
    instructionLines: ['Always build UI using components from the Blend library', "or the repo's shared components directory — no raw markup."],
    tags: [{ label: 'ui', color: ACCENT_PINK }, { label: 'frontend', color: ACCENT }, { label: 'blend', color: ACCENT_GREEN }, { label: 'design-system', color: '#7DD3FC' }],
  },
];

const SceneExample: React.FC<{ data: ExampleData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardOp = interpolate(frame, [12, 32], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const instrOp = interpolate(frame, [35, 55], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagsLabelOp = interpolate(frame, [55, 73], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 34, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 28 }}>{data.eyebrow}</div>
      <div style={{ opacity: cardOp, transform: `scale(${cardScale})`, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)', borderRadius: 24, padding: '36px 52px', width: 1200, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${data.iconGradient[0]}, ${data.iconGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{data.icon}</div>
          <div style={{ fontSize: 52, fontWeight: 800 }}>{data.title}</div>
        </div>
        <div style={{ opacity: instrOp, fontSize: 28, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: 28, paddingLeft: 4 }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Instructions</div>
          {data.instructionLines.map((line, i) => (<React.Fragment key={i}>{line}{i < data.instructionLines.length - 1 && <br />}</React.Fragment>))}
        </div>
        <div style={{ opacity: tagsLabelOp, fontSize: 22, color: ACCENT, fontWeight: 700, marginBottom: 14 }}>Tags</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {data.tags.map((t, i) => <Tag key={t.label} label={t.label} color={t.color} delay={62 + i * 6} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 9: Coming Soon ──────────────────────────────────────────────────

const SceneComingSoon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgePulse = 1 + Math.sin((frame / fps) * 2.2 * Math.PI) * 0.04;
  const badgeScale = spring({ frame, fps, config: { damping: 12, stiffness: 140, mass: 0.7 } });
  const badgeOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOp = interpolate(frame, [18, 40], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [18, 40], [36, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [38, 58], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const iconScale = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 130, mass: 0.8 } });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <div style={{ transform: `scale(${iconScale})`, fontSize: 120, marginBottom: 12, filter: 'drop-shadow(0 10px 40px rgba(255,210,74,0.5))' }}>✨</div>
      <div style={{ opacity: badgeOp, transform: `scale(${badgeScale * badgePulse})`, padding: '10px 28px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT}33, ${ACCENT_PINK}33)`, border: `2px solid ${ACCENT}`, fontSize: 26, fontWeight: 800, letterSpacing: 4, color: ACCENT, marginBottom: 28, boxShadow: `0 10px 40px ${ACCENT}44` }}>COMING SOON</div>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: 82, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, maxWidth: 1400 }}>
        Auto-creation of{' '}<span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Skills</span>
      </div>
      <div style={{ marginTop: 22, opacity: subOp, fontSize: 32, color: 'rgba(255,255,255,0.85)', maxWidth: 1200, fontWeight: 500, lineHeight: 1.4 }}>Tara will soon suggest and create skills for you — automatically.</div>
    </AbsoluteFill>
  );
};

// ── Scene 10: Outro ───────────────────────────────────────────────────────

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 130, mass: 0.8 } });
  const preOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const heroOp = interpolate(frame, [22, 48], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const heroY = interpolate(frame, [22, 48], [40, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: frame - 50, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center' }}>
      <div style={{ transform: `scale(${logoScale})` }}><TaraAvatar size={180} /></div>
      <div style={{ marginTop: 26, opacity: preOp, fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textTransform: 'uppercase' }}>Try it out today</div>
      <div style={{ marginTop: 12, opacity: heroOp, transform: `translateY(${heroY}px)`, fontSize: 110, fontWeight: 800, letterSpacing: -3, lineHeight: 1, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK} 60%, ${ACCENT_GREEN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 10px 40px rgba(255,210,74,0.3))' }}>Build What Matters</div>
      <div style={{ marginTop: 14, opacity: heroOp, fontSize: 44, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: -0.5, fontStyle: 'italic' }}>
        — not{' '}<span style={{ textDecoration: 'line-through', textDecorationColor: ACCENT_PINK, textDecorationThickness: 4, color: 'rgba(255,255,255,0.65)' }}>XYNE</span>
      </div>
      <div style={{ marginTop: 32, display: 'flex', gap: 20 }}>
        <div style={{ transform: `scale(${ctaScale})`, padding: '18px 38px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK})`, fontSize: 32, fontWeight: 800, color: 'white', boxShadow: '0 20px 50px rgba(255,90,122,0.45)' }}>#tara-skills</div>
        <div style={{ transform: `scale(${ctaScale})`, padding: '18px 38px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT_GREEN}, #7DD3FC)`, fontSize: 32, fontWeight: 800, color: 'white', boxShadow: '0 20px 50px rgba(74,222,128,0.45)' }}>#tara-dev</div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──────────────────────────────────────────────────────

export interface TaraSkillsProps {
  sceneFrames: number[];
}

const VO = (id: string) => staticFile(`voiceover/${id}.mp3`);

const TaraSkillsVideo: React.FC<TaraSkillsProps> = ({ sceneFrames }) => {
  const [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10] = sceneFrames;
  return (
    <AbsoluteFill>
      <Background />
      <FloatingShapes />
      <BackgroundMusic />
      <Series>
        <Series.Sequence durationInFrames={f1} name="Title"><SceneTitle /><Audio src={VO('01-title')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f2} name="What"><SceneWhat /><Audio src={VO('02-what')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f3} name="Commands"><SceneCommands /><Audio src={VO('03-commands')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f4} name="Flow"><SceneFlow /><Audio src={VO('04-flow')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f5} name="Scope"><SceneScope /><Audio src={VO('05-scope')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f6} name="Example1"><SceneExample data={EXAMPLES[0]} /><Audio src={VO('06-example1')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f7} name="Example2"><SceneExample data={EXAMPLES[1]} /><Audio src={VO('07-example2')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f8} name="Example3"><SceneExample data={EXAMPLES[2]} /><Audio src={VO('08-example3')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f9} name="ComingSoon"><SceneComingSoon /><Audio src={VO('09-coming-soon')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f10} name="Outro"><SceneOutro /><Audio src={VO('10-outro')} volume={1.0} /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default TaraSkillsVideo;

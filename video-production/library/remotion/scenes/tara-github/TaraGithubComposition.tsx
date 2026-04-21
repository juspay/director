/**
 * @reference-scene TaraGithubComposition
 * @origin Tara GitHub Support announcement video — contributed 2026-04-21
 * @demonstrates Multi-scene product announcement template with voiceover, background music,
 *   platform-drop reveal, coding pipeline visualization, repo-type scoping, example use-cases,
 *   seven-capability roadmap teaser, and tagline outro.
 * @dependencies React, remotion (AbsoluteFill, Img, Series, staticFile, useCurrentFrame, useVideoConfig,
 *   interpolate, Easing, spring), @remotion/media (Audio), @remotion/google-fonts/Inter
 *
 * 10-scene layout (1920x1080 @ 30fps):
 *   1. Title — Tara avatar + "Tara now codes to GitHub"
 *   2. Recap — staggered explainer lines
 *   3. Drop — Bitbucket + GitHub platform reveal
 *   4. Flow — 8-step coding pipeline (context → PR created)
 *   5. Where — 4 repo-type cards (public / private / mono / micro)
 *   6–8. Examples — parameterized use-case cards (bug fix, feature build, code review)
 *   9. Next — "1 of 7" Phase 1 capabilities roadmap teaser
 *  10. Outro — "Build what matters. Now on GitHub too." + CTA pills
 *
 * Audio assets (generated at build time, NOT committed):
 *   public/voiceover/01-title.mp3 … 10-outro.mp3  — per-scene voiceover
 *   public/voiceover/music-01.mp3                  — background music (looped, reused from tara-skills)
 *   public/voiceover/durations.json                — audio durations for dynamic scene sizing
 *
 * Run `node scripts/generate-voiceover-tara-github.mjs` and `node scripts/generate-music.mjs`
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
const SKY = '#7DD3FC';
const BITBUCKET_BLUE = '#2684FF';
const GITHUB_BLACK = '#0D1117';

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

// ── Platform marks ───────────────────────────────────────────────────────

const GitHubMark: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
      fill="white"
    />
  </svg>
);

const BitbucketMark: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81a1.05 1.05 0 0 0 1.022.874H19.5a.768.768 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.77-.892zm13.792 14.412h-5.12L8.064 9.626h7.574z"
      fill="white"
    />
  </svg>
);

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
      <div style={{ transform: `scale(${logoScale})` }}><TaraAvatar size={240} /></div>
      <div style={{ marginTop: 40, opacity: titleOpacity, transform: `translateY(${titleY}px)`, fontSize: 92, fontWeight: 800, letterSpacing: -2 }}>
        Tara now codes to{' '}
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_GREEN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GitHub</span>
      </div>
      <div style={{ marginTop: 16, opacity: subOpacity, fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>A new language, from the same Slack thread</div>
      <div style={{ marginTop: 28, transform: `scale(${badgeScale})`, padding: '12px 26px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, fontSize: 24, fontWeight: 700, color: ACCENT }}>✦ NEW</div>
    </AbsoluteFill>
  );
};

// ── Scene 2: Recap ────────────────────────────────────────────────────────

const SceneRecap: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headY = interpolate(frame, [0, 18], [30, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const lines = [
    'You already know what Tara does.',
    'She reads your threads,',
    'plans with you,',
    'and ships code — straight from Slack.',
  ];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 80 }}>
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, fontSize: 40, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 36 }}>A quick reminder</div>
      <div style={{ textAlign: 'center', maxWidth: 1200 }}>
        {lines.map((line, i) => {
          const start = 20 + i * 14;
          const op = interpolate(frame, [start, start + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(frame, [start, start + 18], [24, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <div key={i} style={{ opacity: op, transform: `translateY(${y}px)`, fontSize: 50, fontWeight: 600, lineHeight: 1.35, color: i === 0 ? 'rgba(255,255,255,0.88)' : 'white' }}>{line}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: The Drop ─────────────────────────────────────────────────────

const PlatformCard: React.FC<{ mark: React.ReactNode; name: string; color: string; tag: string; tagColor: string; delay: number; muted?: boolean }> = ({ mark, name, color, tag, tagColor, delay, muted }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const op = interpolate(frame, [delay, delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: op, transform: `scale(${s})`, width: 420, height: 420, borderRadius: 28, background: color, border: `3px solid ${muted ? 'rgba(255,255,255,0.35)' : 'white'}`, boxShadow: `0 30px 80px ${color}AA`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative' }}>
      <div>{mark}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: 'white', letterSpacing: -1 }}>{name}</div>
      <div style={{ position: 'absolute', top: -16, padding: '8px 20px', borderRadius: 999, background: tagColor, color: muted ? 'rgba(0,0,0,0.75)' : GITHUB_BLACK, fontSize: 20, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>{tag}</div>
    </div>
  );
};

const SceneDrop: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const plusOp = interpolate(frame, [36, 54], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT_GREEN, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 44 }}>She builds where you build</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
        <PlatformCard mark={<BitbucketMark />} name="Bitbucket" color={BITBUCKET_BLUE} tag="Since day one" tagColor="rgba(255,255,255,0.9)" delay={18} muted />
        <div style={{ opacity: plusOp, fontSize: 40, fontWeight: 800, color: ACCENT, padding: '14px 22px', borderRadius: 999, background: 'rgba(255,210,74,0.18)', border: `2px solid ${ACCENT}` }}>+ now also</div>
        <PlatformCard mark={<GitHubMark />} name="GitHub" color={GITHUB_BLACK} tag="New" tagColor={ACCENT} delay={40} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Same Flow (8-step pipeline) ─────────────────────────────────

const PipelinePill: React.FC<{ label: string; delay: number; color: string }> = ({ label, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const op = interpolate(frame, [delay, delay + 14], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const checkOp = interpolate(frame, [delay + 8, delay + 20], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: op, transform: `scale(${s})`, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: `2px solid ${color}`, boxShadow: `0 10px 30px ${color}33`, minWidth: 320 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GITHUB_BLACK, fontSize: 18, fontWeight: 800, opacity: checkOp }}>✓</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{label}</div>
    </div>
  );
};

const PIPELINE = [
  { label: 'Context gathered', color: ACCENT_GREEN },
  { label: 'Repository cloned', color: SKY },
  { label: 'Branch configured', color: ACCENT },
  { label: 'Code analyzed', color: ACCENT_PINK },
  { label: 'Changes implemented', color: ACCENT_GREEN },
  { label: 'Commit pushed', color: SKY },
  { label: 'Pull request created', color: ACCENT },
];

const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>Same flow, new platform</div>
      <div style={{ opacity: subOp, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginBottom: 38, textAlign: 'center' }}>Same conversation. Same thread. Same Tara.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 18, justifyContent: 'center' }}>
        {PIPELINE.map((p, i) => (
          <PipelinePill key={p.label} label={p.label} color={p.color} delay={30 + i * 12} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: Where to Use ────────────────────────────────────────────────

const RepoTypeCard: React.FC<{ icon: string; label: string; color: string; delay: number }> = ({ icon, label, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const op = interpolate(frame, [delay, delay + 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity: op, transform: `scale(${s})`, width: 280, padding: '36px 24px', borderRadius: 22, background: 'rgba(255,255,255,0.1)', border: `2px solid ${color}`, boxShadow: `0 20px 50px ${color}33`, textAlign: 'center' }}>
      <div style={{ fontSize: 58, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: -0.5 }}>{label}</div>
    </div>
  );
};

const SceneWhere: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [10, 28], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 40, fontWeight: 700, color: ACCENT_PINK, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>Any repo your team has</div>
      <div style={{ opacity: subOp, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginBottom: 44, textAlign: 'center' }}>She handles them the same way</div>
      <div style={{ display: 'flex', gap: 28 }}>
        <RepoTypeCard icon="🌐" label="Public" color={ACCENT_GREEN} delay={22} />
        <RepoTypeCard icon="🔒" label="Private" color={ACCENT} delay={34} />
        <RepoTypeCard icon="🏛" label="Mono-repo" color={SKY} delay={46} />
        <RepoTypeCard icon="🧩" label="Micro-repo" color={ACCENT_PINK} delay={58} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scenes 6–8: Parameterized Example ─────────────────────────────────────

interface ExampleData {
  eyebrow: string;
  title: string;
  icon: string;
  iconGradient: [string, string];
  instructionLines: string[];
  tagline: string;
}

const EXAMPLES: ExampleData[] = [
  {
    eyebrow: 'Use case 1 of 3',
    title: 'Fix a bug',
    icon: '🐛',
    iconGradient: [ACCENT_PINK, ACCENT],
    instructionLines: [
      'Drop a GitHub issue link in a thread. Say "fix this."',
      'Tara reads the issue, traces the code,',
      'and opens a pull request with the fix.',
    ],
    tagline: '@TARA fix github.com/org/repo/issues/42',
  },
  {
    eyebrow: 'Use case 2 of 3',
    title: 'Build a feature',
    icon: '✨',
    iconGradient: [ACCENT, ACCENT_GREEN],
    instructionLines: [
      'Share a Figma link and a GitHub repo.',
      'Tara plans the feature, implements it,',
      'and pushes a PR for review — no context switch.',
    ],
    tagline: '@TARA build this Figma in github.com/org/app',
  },
  {
    eyebrow: 'Use case 3 of 3',
    title: 'Review a PR',
    icon: '🔍',
    iconGradient: [SKY, ACCENT_GREEN],
    instructionLines: [
      'Tag Tara on any GitHub pull request.',
      'She reviews it the way a senior engineer would —',
      'line by line, with reasoning.',
    ],
    tagline: '@TARA review github.com/org/repo/pull/123',
  },
];

const SceneExample: React.FC<{ data: ExampleData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardOp = interpolate(frame, [12, 32], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const instrOp = interpolate(frame, [35, 55], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagOp = interpolate(frame, [58, 78], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 34, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 28 }}>{data.eyebrow}</div>
      <div style={{ opacity: cardOp, transform: `scale(${cardScale})`, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)', borderRadius: 24, padding: '36px 52px', width: 1200, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${data.iconGradient[0]}, ${data.iconGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{data.icon}</div>
          <div style={{ fontSize: 52, fontWeight: 800 }}>{data.title}</div>
        </div>
        <div style={{ opacity: instrOp, fontSize: 28, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: 28, paddingLeft: 4 }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>How it works</div>
          {data.instructionLines.map((line, i) => (
            <React.Fragment key={i}>{line}{i < data.instructionLines.length - 1 && <br />}</React.Fragment>
          ))}
        </div>
        <div style={{ opacity: tagOp, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 22px', borderRadius: 14, background: 'rgba(13,17,23,0.6)', border: `1px solid ${ACCENT_GREEN}`, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 24, color: ACCENT_GREEN }}>
          <span style={{ color: ACCENT_PINK }}>▸</span>{data.tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 9: What's Next (1 of 7) ─────────────────────────────────────────

const SceneNext: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headOp = interpolate(frame, [0, 18], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOp = interpolate(frame, [18, 40], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [18, 40], [36, 0], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [40, 60], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const capsulePulse = 1 + Math.sin((frame / fps) * 2.2 * Math.PI) * 0.05;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: 'white', textAlign: 'center', padding: 60 }}>
      <div style={{ opacity: headOp, fontSize: 34, fontWeight: 700, color: ACCENT, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24 }}>Phase 1 Roadmap</div>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: 80, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, maxWidth: 1400, marginBottom: 40 }}>
        One of{' '}<span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>seven</span>{' '}capabilities
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const active = i === 0;
          const delay = 40 + i * 6;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
          const op = interpolate(frame, [delay, delay + 14], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: op, transform: `scale(${s * (active ? capsulePulse : 1)})`, width: 92, height: 92, borderRadius: 22, background: active ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK})` : 'rgba(255,255,255,0.08)', border: `2px solid ${active ? ACCENT : 'rgba(255,255,255,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, color: active ? GITHUB_BLACK : 'rgba(255,255,255,0.55)', boxShadow: active ? `0 15px 40px ${ACCENT}66` : 'none' }}>
              {i + 1}
            </div>
          );
        })}
      </div>
      <div style={{ opacity: subOp, fontSize: 28, color: 'rgba(255,255,255,0.85)', fontWeight: 500, letterSpacing: 0 }}>GitHub coding is live today. Watch this thread — more dropping through the week.</div>
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
      <div style={{ marginTop: 14, opacity: heroOp, fontSize: 44, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: -0.5 }}>Now on GitHub too.</div>
      <div style={{ marginTop: 32, display: 'flex', gap: 20 }}>
        <div style={{ transform: `scale(${ctaScale})`, padding: '18px 38px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_PINK})`, fontSize: 32, fontWeight: 800, color: 'white', boxShadow: '0 20px 50px rgba(255,90,122,0.45)' }}>#tara-playground</div>
        <div style={{ transform: `scale(${ctaScale})`, padding: '18px 38px', borderRadius: 999, background: `linear-gradient(135deg, ${ACCENT_GREEN}, ${SKY})`, fontSize: 32, fontWeight: 800, color: 'white', boxShadow: '0 20px 50px rgba(74,222,128,0.45)' }}>#tara-dev</div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main Composition ──────────────────────────────────────────────────────

export interface TaraGithubProps {
  sceneFrames: number[];
}

const VO = (id: string) => staticFile(`voiceover/${id}.mp3`);

const TaraGithubVideo: React.FC<TaraGithubProps> = ({ sceneFrames }) => {
  const [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10] = sceneFrames;
  return (
    <AbsoluteFill>
      <Background />
      <FloatingShapes />
      <BackgroundMusic />
      <Series>
        <Series.Sequence durationInFrames={f1} name="Title"><SceneTitle /><Audio src={VO('01-title')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f2} name="Recap"><SceneRecap /><Audio src={VO('02-recap')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f3} name="Drop"><SceneDrop /><Audio src={VO('03-drop')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f4} name="Flow"><SceneFlow /><Audio src={VO('04-flow')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f5} name="Where"><SceneWhere /><Audio src={VO('05-where')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f6} name="Example1"><SceneExample data={EXAMPLES[0]} /><Audio src={VO('06-example1')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f7} name="Example2"><SceneExample data={EXAMPLES[1]} /><Audio src={VO('07-example2')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f8} name="Example3"><SceneExample data={EXAMPLES[2]} /><Audio src={VO('08-example3')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f9} name="Next"><SceneNext /><Audio src={VO('09-next')} volume={1.0} /></Series.Sequence>
        <Series.Sequence durationInFrames={f10} name="Outro"><SceneOutro /><Audio src={VO('10-outro')} volume={1.0} /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export default TaraGithubVideo;

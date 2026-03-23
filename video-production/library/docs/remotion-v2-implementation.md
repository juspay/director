# Remotion V2 Video Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Remotion-based motion graphics video for Tara AI product launch, replacing the FFmpeg assembly pipeline to break past the 6.5/10 Gemini score ceiling.

**Architecture:** A standalone Remotion 4.x project at `docs/plans/video-production/v7/remotion-v2/`. 24 scenes sequenced via `<Sequence>` components, with 4 scene categories (Abstract, Screenshot, Special, Closing), 3 transition types (Thread, FadeBlack, Morph), and dual audio layers (voiceover + music with volume automation). Assets are symlinked from existing directories — no new asset generation needed.

**Tech Stack:** Remotion 4.0.x, React 19, TypeScript, @remotion/google-fonts, @remotion/media-utils

**Spec:** `docs/superpowers/specs/2026-03-12-remotion-v2-video-rebuild-design.md`

---

## File Structure

```
docs/plans/video-production/v7/remotion-v2/
├── package.json              # Dependencies + render scripts
├── tsconfig.json             # Strict TS config
├── remotion.config.ts        # Remotion webpack config
├── public/
│   ├── voiceover/            # symlink → ../../assets/voiceover/v7/
│   ├── music/                # symlink → ../../assets/music/
│   ├── avatar/               # symlink → ../../../assets/avatar/
│   ├── screenshots/          # symlink → ../../../assets/screenshots/
│   └── veo2/                 # symlink → ../../output/veo3/
├── src/
│   ├── Root.tsx              # Composition registration + font loading
│   ├── TaraVideo.tsx         # Main composition: audio + scenes + transitions
│   ├── theme.ts              # Colors, fonts, springs
│   ├── timing.ts             # 24 scene entries with frame boundaries
│   ├── components/
│   │   ├── TaraAvatar.tsx
│   │   ├── AmberThread.tsx
│   │   ├── TypingCursor.tsx
│   │   ├── TextOverlay.tsx
│   │   └── StarMotif.tsx
│   │   # Note: SlackMessage.tsx from spec intentionally omitted —
│   │   # screenshot scenes overlay on real PNGs which already contain
│   │   # real Slack messages. Fake overlays would conflict.
│   ├── scenes/
│   │   ├── AbstractScene.tsx
│   │   ├── ScreenshotScene.tsx
│   │   ├── MetricsScene.tsx
│   │   ├── BuildersScene.tsx
│   │   ├── ThesisScene.tsx
│   │   └── TaglineScene.tsx
│   └── transitions/
│       ├── ThreadTransition.tsx
│       ├── FadeBlackTransition.tsx
│       └── MorphTransition.tsx
└── out/                      # Rendered output (gitignored)
```

---

## Chunk 1: Project Scaffold + Core Data

### Task 1: Initialize Remotion project

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/package.json`
- Create: `docs/plans/video-production/v7/remotion-v2/tsconfig.json`
- Create: `docs/plans/video-production/v7/remotion-v2/remotion.config.ts`
- Create: `docs/plans/video-production/v7/remotion-v2/.gitignore`

**All paths below are relative to `docs/plans/video-production/v7/remotion-v2/`.**

- [ ] **Step 1: Create project directory**

```bash
mkdir -p docs/plans/video-production/v7/remotion-v2/{src,public,out}
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "tara-video-v2",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "render:draft": "remotion render TaraVideoV2 out/tara_v2_draft.mp4 --image-format=jpeg --jpeg-quality=60 --concurrency=4",
    "render": "remotion render TaraVideoV2 out/tara_v2.mp4 --codec=h264 --crf=18 --image-format=jpeg --jpeg-quality=100",
    "render:720p": "remotion render TaraVideoV2 out/tara_v2_720p.mp4 --codec=h264 --crf=18 --scale=0.667"
  },
  "dependencies": {
    "@remotion/cli": "4.0.434",
    "@remotion/google-fonts": "4.0.434",
    "@remotion/media-utils": "4.0.434",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "remotion": "4.0.434"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "remotion.config.ts"]
}
```

- [ ] **Step 4: Create remotion.config.ts**

```typescript
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
out/
dist/
.remotion/
```

- [ ] **Step 6: Install dependencies**

```bash
cd docs/plans/video-production/v7/remotion-v2 && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/package.json docs/plans/video-production/v7/remotion-v2/tsconfig.json docs/plans/video-production/v7/remotion-v2/remotion.config.ts docs/plans/video-production/v7/remotion-v2/.gitignore
git commit -m "feat(video): scaffold Remotion V2 project with dependencies"
```

---

### Task 2: Create symlinks for assets

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/public/voiceover` (symlink)
- Create: `docs/plans/video-production/v7/remotion-v2/public/music` (symlink)
- Create: `docs/plans/video-production/v7/remotion-v2/public/avatar` (symlink)
- Create: `docs/plans/video-production/v7/remotion-v2/public/screenshots` (symlink)
- Create: `docs/plans/video-production/v7/remotion-v2/public/veo2` (symlink)

- [ ] **Step 1: Create all symlinks**

Run from `docs/plans/video-production/v7/remotion-v2/`:

```bash
cd docs/plans/video-production/v7/remotion-v2/public
ln -s ../../assets/voiceover/v7 voiceover
ln -s ../../assets/music music
ln -s ../../../assets/avatar avatar
ln -s ../../../assets/screenshots screenshots
ln -s ../../output/veo3 veo2
```

- [ ] **Step 2: Verify all symlinks resolve**

```bash
ls -la docs/plans/video-production/v7/remotion-v2/public/
# Each symlink should show -> target
ls docs/plans/video-production/v7/remotion-v2/public/voiceover/tara-v7-newvoice_v1.mp3
ls docs/plans/video-production/v7/remotion-v2/public/music/tara_v74_music.wav
ls docs/plans/video-production/v7/remotion-v2/public/avatar/tara_square_nobg.png
ls docs/plans/video-production/v7/remotion-v2/public/screenshots/tara-slack-search.png
ls docs/plans/video-production/v7/remotion-v2/public/veo2/01_opening_v2.mp4
```

Expected: All files found, no broken symlinks.

- [ ] **Step 3: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/public/
git commit -m "feat(video): add asset symlinks for voiceover, music, avatar, screenshots, veo2"
```

---

### Task 3: Create theme.ts (design tokens)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/theme.ts`

- [ ] **Step 1: Write theme.ts**

```typescript
export const theme = {
  canvas: { dark: '#0f172a', mid: '#1e293b', card: '#1a2332' },
  amber: { primary: '#d97706', light: '#f59e0b', dim: '#92400e' },
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  accent: { green: '#4ade80', blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899' },
  slack: { bg: '#1a1d21', message: '#222529', border: '#383a3e' },
} as const;

export const springs = {
  gentle: { damping: 20, mass: 0.8, stiffness: 80 },
  snappy: { damping: 15, mass: 0.5, stiffness: 200 },
  bouncy: { damping: 12, mass: 0.6, stiffness: 150 },
  slow: { damping: 30, mass: 1.0, stiffness: 50 },
} as const;

export const fonts = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'SF Mono', 'Fira Code', monospace",
  serif: "'Playfair Display', Georgia, serif",
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 4385; // ceil(146.16 * 30)
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/theme.ts
git commit -m "feat(video): add design system tokens (colors, springs, fonts)"
```

---

### Task 4: Create timing.ts (24 scene entries)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/timing.ts`

- [ ] **Step 1: Write timing.ts with all 24 scenes**

Each scene entry is derived from the timing map. `startFrame = Math.round(narration_start * 30)`, `durationFrames = Math.round(duration * 30)`.

```typescript
import { FPS } from './theme';

export type SceneCategory = 'abstract' | 'screenshot' | 'special' | 'closing';
export type TransitionType = 'thread' | 'fadeBlack' | 'morph';

export interface SceneEntry {
  id: string;
  category: SceneCategory;
  startFrame: number;
  durationFrames: number;
  asset: string;
  transition: TransitionType;
  textOverlay?: string;
}

export const SCENES: SceneEntry[] = [
  // 1. 01_opening — Abstract — 8.78s from 0.00s
  { id: '01_opening', category: 'abstract', startFrame: 0, durationFrames: 263, asset: '01_opening_v2.mp4', transition: 'thread' },
  // 2. 03_gap — Abstract — 6.52s from 8.78s
  { id: '03_gap', category: 'abstract', startFrame: 263, durationFrames: 196, asset: '03_gap_v2.mp4', transition: 'thread' },
  // 3. 04_history — Screenshot — 12.24s from 15.30s
  { id: '04_history', category: 'screenshot', startFrame: 459, durationFrames: 367, asset: 'race-condition-confirmed.png', transition: 'thread' },
  // 4. 05_weight — Abstract — 6.92s from 27.54s
  { id: '05_weight', category: 'abstract', startFrame: 826, durationFrames: 208, asset: '05_weight_v2.mp4', transition: 'thread' },
  // 5. bridge_weight_thesis — Abstract — 2.00s from 34.46s
  { id: 'bridge_weight_thesis', category: 'abstract', startFrame: 1034, durationFrames: 60, asset: 'bridge_weight_to_thesis_v2.mp4', transition: 'fadeBlack' },
  // 6. 06a_thesis_rise — Abstract — 8.68s from 36.46s
  { id: '06a_thesis_rise', category: 'abstract', startFrame: 1094, durationFrames: 260, asset: '06_thesis_v2.mp4', transition: 'thread' },
  // 7. 06b_thesis_friction — Abstract — 10.56s from 45.14s
  { id: '06b_thesis_friction', category: 'abstract', startFrame: 1354, durationFrames: 317, asset: '06b_friction_v2.mp4', transition: 'thread' },
  // 8. 06c_thesis_closer — Special — 1.70s from 55.70s
  { id: '06c_thesis_closer', category: 'special', startFrame: 1671, durationFrames: 51, asset: '06c_tara_reveal_v2.mp4', transition: 'morph' },
  // 9. transition_to_slack — Abstract — 1.00s from 57.40s
  { id: 'transition_to_slack', category: 'abstract', startFrame: 1722, durationFrames: 30, asset: 'bridge_thesis_to_slack_v2.mp4', transition: 'thread' },
  // 10. 07_slack_thread — Screenshot — 8.03s from 58.40s
  { id: '07_slack_thread', category: 'screenshot', startFrame: 1752, durationFrames: 241, asset: 'tara-slack-search.png', transition: 'thread' },
  // 11. 08_investigation — Screenshot — 12.42s from 66.43s
  { id: '08_investigation', category: 'screenshot', startFrame: 1993, durationFrames: 373, asset: 'bug-fix-tara-response.png', transition: 'thread' },
  // 12. 10_team_collab — Screenshot — 10.87s from 78.85s
  { id: '10_team_collab', category: 'screenshot', startFrame: 2366, durationFrames: 326, asset: 'async-loop-yaswanth-review.png', transition: 'thread' },
  // 13. 11a_plan_forms — Screenshot — 7.00s from 89.72s
  { id: '11a_plan_forms', category: 'screenshot', startFrame: 2692, durationFrames: 210, asset: 'tara-jira-pdf-report.png', transition: 'thread' },
  // 14. 11b_plan_moves — Abstract — 6.79s from 96.72s
  { id: '11b_plan_moves', category: 'abstract', startFrame: 2902, durationFrames: 204, asset: '11_plan_forms_v3.mp4', transition: 'thread' },
  // 15. 12a_execution — Screenshot — 9.24s from 103.51s
  { id: '12a_execution', category: 'screenshot', startFrame: 3105, durationFrames: 277, asset: 'coding-agent-implementing.png', transition: 'thread' },
  // 16. 12b_prs — Screenshot — 6.16s from 112.75s
  { id: '12b_prs', category: 'screenshot', startFrame: 3383, durationFrames: 185, asset: 'coding-agent-progress.png', transition: 'thread' },
  // 17. 13_ecosystem — Screenshot — 4.30s from 118.91s
  { id: '13_ecosystem', category: 'screenshot', startFrame: 3567, durationFrames: 129, asset: 'vinay-backend-configs.png', transition: 'thread' },
  // 18. 14_integrations — Abstract — 5.36s from 123.21s
  { id: '14_integrations', category: 'abstract', startFrame: 3696, durationFrames: 161, asset: '14_tara_connects_v2.mp4', transition: 'thread', textOverlay: 'Slack \u00b7 Bitbucket \u00b7 JIRA \u00b7 GitHub' },
  // 19. bridge_demo_impact — Abstract — 1.50s from 128.57s
  { id: 'bridge_demo_impact', category: 'abstract', startFrame: 3857, durationFrames: 45, asset: 'bridge_demo_to_impact_v2.mp4', transition: 'fadeBlack' },
  // 20. 15_metrics — Special — 5.65s from 130.07s
  { id: '15_metrics', category: 'special', startFrame: 3902, durationFrames: 170, asset: '15_metrics_v2.mp4', transition: 'morph' },
  // 21. 17_future — Abstract — 1.81s from 135.72s
  { id: '17_future', category: 'abstract', startFrame: 4072, durationFrames: 54, asset: '17_future_v2.mp4', transition: 'thread' },
  // 22. 18_builders — Special — 1.95s from 137.53s
  { id: '18_builders', category: 'special', startFrame: 4126, durationFrames: 59, asset: '18_builders_v2.mp4', transition: 'morph' },
  // 23. 19_constellation — Abstract — 3.81s from 139.48s
  { id: '19_constellation', category: 'abstract', startFrame: 4184, durationFrames: 114, asset: '19_constellation_v2.mp4', transition: 'thread', textOverlay: 'Right where the conversation started.' },
  // 24. 21_tagline — Closing — 2.87s from 143.29s
  { id: '21_tagline', category: 'closing', startFrame: 4299, durationFrames: 86, asset: '', transition: 'thread' },
];

// Verify: last scene ends at frame 4299 + 86 = 4385 = DURATION_FRAMES ✓
```

- [ ] **Step 2: Verify frame math**

Quick sanity check: `4299 + 86 = 4385` which matches `ceil(146.16 * 30)`. Each `startFrame` equals previous scene's `startFrame + durationFrames`.

- [ ] **Step 3: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/timing.ts
git commit -m "feat(video): add 24-scene timing data with frame-accurate boundaries"
```

---

### Task 5: Create Root.tsx + minimal TaraVideo.tsx (renders black with audio)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/Root.tsx`
- Create: `docs/plans/video-production/v7/remotion-v2/src/TaraVideo.tsx`

- [ ] **Step 1: Write Root.tsx with font loading**

```typescript
import React, { useEffect } from 'react';
import { Composition, delayRender, continueRender } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { TaraVideo } from './TaraVideo';
import { FPS, DURATION_FRAMES, WIDTH, HEIGHT } from './theme';

const { waitUntilDone: waitInter } = loadInter();
const { waitUntilDone: waitPlayfair } = loadPlayfair();

export const RemotionRoot: React.FC = () => {
  const [handle] = React.useState(() => delayRender());

  useEffect(() => {
    Promise.all([waitInter(), waitPlayfair()]).then(() => {
      continueRender(handle);
    });
  }, [handle]);

  return (
    <Composition
      id="TaraVideoV2"
      component={TaraVideo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
```

- [ ] **Step 2: Write minimal TaraVideo.tsx (dark bg + audio only)**

This is a scaffolding version that proves audio works. Scenes will be added in subsequent tasks.

```typescript
import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { theme, FPS } from './theme';

const musicVolume = (frame: number): number => {
  const t = frame / FPS;
  if (t < 2) return interpolate(t, [0, 2], [0, 0.12]);
  if (t < 15) return 0.12;
  if (t < 34) return 0.15;
  if (t < 36) return 0.08;
  if (t < 55) return 0.18;
  if (t < 58) return 0.10;
  if (t < 78) return 0.15;
  if (t < 96) return 0.12;
  if (t < 123) return 0.18;
  if (t < 130) return 0.08;
  if (t < 136) return 0.22;
  if (t < 140) return 0.20;
  return interpolate(t, [140, 146], [0.15, 0], { extrapolateRight: 'clamp' });
};

export const TaraVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: theme.canvas.dark }}>
      <Audio src={staticFile('voiceover/tara-v7-newvoice_v1.mp3')} />
      <Audio
        src={staticFile('music/tara_v74_music.wav')}
        volume={musicVolume}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Verify Remotion Studio launches**

```bash
cd docs/plans/video-production/v7/remotion-v2 && npm start
```

Expected: Browser opens Remotion Studio. You see a dark canvas. Audio plays when you scrub the timeline. No errors in console.

- [ ] **Step 4: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/Root.tsx docs/plans/video-production/v7/remotion-v2/src/TaraVideo.tsx
git commit -m "feat(video): add Root.tsx with font loading and TaraVideo.tsx with audio layers"
```

---

## Chunk 2: Reusable Components

### Task 6: TextOverlay component

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/components/TextOverlay.tsx`

- [ ] **Step 1: Write TextOverlay.tsx**

```typescript
import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { springs, fonts, FPS } from '../theme';

interface TextOverlayProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  delay?: number; // frames before entrance
  withBackground?: boolean;
  style?: React.CSSProperties;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  fontSize = 36,
  fontFamily = fonts.sans,
  color = '#f1f5f9',
  delay = 0,
  withBackground = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.gentle,
  });

  const translateY = interpolate(progress, [0, 1], [20, 0]);
  const opacity = progress;

  return (
    <div
      style={{
        position: 'absolute',
        fontFamily,
        fontSize,
        color,
        transform: `translateY(${translateY}px)`,
        opacity,
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
        ...(withBackground
          ? {
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '8px 16px',
              borderRadius: 8,
            }
          : {}),
        ...style,
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/components/TextOverlay.tsx
git commit -m "feat(video): add TextOverlay component with spring entrance"
```

---

### Task 7: TypingCursor component

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/components/TypingCursor.tsx`

- [ ] **Step 1: Write TypingCursor.tsx**

```typescript
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { theme } from '../theme';

interface TypingCursorProps {
  x: number;
  y: number;
  size?: number;
  /** Keyframe path: array of [frame, x, y] tuples for position animation */
  path?: [number, number, number][];
}

export const TypingCursor: React.FC<TypingCursorProps> = ({
  x,
  y,
  size = 20,
  path,
}) => {
  const frame = useCurrentFrame();

  // Blink: on for 15 frames, off for 15 frames
  const blinkCycle = frame % 30;
  const opacity = blinkCycle < 15 ? 0.9 : 0;

  // Animate position along path if provided
  let curX = x;
  let curY = y;
  if (path && path.length > 1) {
    const frames = path.map((p) => p[0]);
    const xs = path.map((p) => p[1]);
    const ys = path.map((p) => p[2]);
    curX = interpolate(frame, frames, xs, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    curY = interpolate(frame, frames, ys, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: curX,
        top: curY,
        width: 2,
        height: size,
        backgroundColor: theme.accent.green,
        opacity,
        borderRadius: 1,
      }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/components/TypingCursor.tsx
git commit -m "feat(video): add TypingCursor component with blink and path animation"
```

---

### Task 8: TaraAvatar component

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/components/TaraAvatar.tsx`

- [ ] **Step 1: Write TaraAvatar.tsx**

```typescript
import React from 'react';
import { Img, useCurrentFrame, spring, staticFile } from 'remotion';
import { theme, springs, FPS } from '../theme';

interface TaraAvatarProps {
  size?: number;
  x?: number;
  y?: number;
  delay?: number; // frames before entrance
}

export const TaraAvatar: React.FC<TaraAvatarProps> = ({
  size = 160,
  x,
  y,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const scale = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.bouncy,
  });

  // Amber glow pulse: 2s cycle (60 frames), alpha 0.3 → 0.6
  const glowAlpha = 0.3 + 0.15 * (1 + Math.sin((frame / 60) * Math.PI * 2));

  const posX = x ?? 1920 - size - 20;
  const posY = y ?? 1080 - size - 20;

  return (
    <div
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${theme.amber.primary}`,
        overflow: 'hidden',
        transform: `scale(${scale})`,
        boxShadow: `0 0 20px rgba(217, 119, 6, ${glowAlpha})`,
      }}
    >
      <Img
        src={staticFile('avatar/tara_square_nobg.png')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/components/TaraAvatar.tsx
git commit -m "feat(video): add TaraAvatar component with bouncy entrance and amber glow"
```

---

### Task 9: StarMotif component

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/components/StarMotif.tsx`

- [ ] **Step 1: Write StarMotif.tsx**

A 5-pointed star SVG with 3 concentric glow rings that expand with staggered timing.

```typescript
import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, FPS } from '../theme';

interface StarMotifProps {
  x: number;
  y: number;
  size?: number;
  delay?: number;
  ringStagger?: number; // frames between each ring
}

export const StarMotif: React.FC<StarMotifProps> = ({
  x,
  y,
  size = 80,
  delay = 0,
  ringStagger = 8,
}) => {
  const frame = useCurrentFrame();
  const adjusted = Math.max(0, frame - delay);

  const starScale = spring({
    frame: adjusted,
    fps: FPS,
    config: springs.bouncy,
  });

  const rings = [0, 1, 2].map((i) => {
    const ringFrame = Math.max(0, adjusted - i * ringStagger);
    const ringScale = spring({
      frame: ringFrame,
      fps: FPS,
      config: springs.gentle,
    });
    const ringOpacity = interpolate(ringScale, [0, 0.5, 1], [0, 0.4, 0.1]);
    const ringSize = size * (1.5 + i * 0.5) * ringScale;
    return { ringSize, ringOpacity, key: i };
  });

  // 5-pointed star path
  const starPath = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? size * 0.4 : size * 0.18;
    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      {/* Glow rings */}
      {rings.map(({ ringSize, ringOpacity, key }) => (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: -ringSize / 2,
            top: -ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `1px solid ${theme.amber.primary}`,
            opacity: ringOpacity,
          }}
        />
      ))}
      {/* Star */}
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        style={{
          position: 'absolute',
          left: -size / 2,
          top: -size / 2,
          transform: `scale(${starScale})`,
        }}
      >
        <polygon
          points={starPath}
          fill={theme.amber.primary}
          stroke={theme.amber.light}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/components/StarMotif.tsx
git commit -m "feat(video): add StarMotif component with concentric glow rings"
```

---

### Task 10: AmberThread component

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/components/AmberThread.tsx`

- [ ] **Step 1: Write AmberThread.tsx**

```typescript
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { theme, WIDTH, HEIGHT } from '../theme';

interface AmberThreadProps {
  /** Direction: 'left-to-right' | 'right-to-left' | 'converge-center' */
  direction?: 'left-to-right' | 'right-to-left' | 'converge-center';
  /** Total frames to draw */
  drawDuration?: number;
}

export const AmberThread: React.FC<AmberThreadProps> = ({
  direction = 'left-to-right',
  drawDuration = 20,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, drawDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pathLength = WIDTH + 200; // slightly longer than screen
  const dashOffset = pathLength * (1 - progress);

  if (direction === 'converge-center') {
    // Two threads from edges to center
    return (
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <line
          x1={0}
          y1={HEIGHT / 2}
          x2={WIDTH / 2}
          y2={HEIGHT / 2}
          stroke={theme.amber.primary}
          strokeWidth={2}
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          opacity={0.8}
        />
        <line
          x1={WIDTH}
          y1={HEIGHT / 2}
          x2={WIDTH / 2}
          y2={HEIGHT / 2}
          stroke={theme.amber.primary}
          strokeWidth={2}
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          opacity={0.8}
        />
      </svg>
    );
  }

  const x1 = direction === 'left-to-right' ? -100 : WIDTH + 100;
  const x2 = direction === 'left-to-right' ? WIDTH + 100 : -100;

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <line
        x1={x1}
        y1={HEIGHT / 2}
        x2={x2}
        y2={HEIGHT / 2}
        stroke={theme.amber.primary}
        strokeWidth={2}
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        opacity={0.8}
      />
    </svg>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/components/AmberThread.tsx
git commit -m "feat(video): add AmberThread component with stroke-dash animation"
```

---

## Chunk 3: Transitions

### Task 11: ThreadTransition

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/transitions/ThreadTransition.tsx`

- [ ] **Step 1: Write ThreadTransition.tsx**

```typescript
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AmberThread } from '../components/AmberThread';

export const ThreadTransition: React.FC = () => {
  return (
    <AbsoluteFill>
      <AmberThread direction="left-to-right" drawDuration={20} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/transitions/ThreadTransition.tsx
git commit -m "feat(video): add ThreadTransition overlay"
```

---

### Task 12: FadeBlackTransition

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/transitions/FadeBlackTransition.tsx`

- [ ] **Step 1: Write FadeBlackTransition.tsx**

The transition is 24 frames total (overlapping last 12 of scene N, first 12 of scene N+1). Fade to black for first 12, fade from black for last 12.

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const FadeBlackTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // 24 frames total: 0-12 = fade to black, 12-24 = fade from black
  const opacity = interpolate(
    frame,
    [0, 12, 12, 24],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${opacity})` }} />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/transitions/FadeBlackTransition.tsx
git commit -m "feat(video): add FadeBlackTransition overlay"
```

---

### Task 13: MorphTransition

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/transitions/MorphTransition.tsx`

- [ ] **Step 1: Write MorphTransition.tsx**

Outgoing scene scales 1.0→1.1 with blur; incoming scene scales 0.95→1.0 with opacity. Since transitions are overlays (not wrapping scenes), this creates a bright blur overlay for the first half and fades it out in the second half.

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { theme } from '../theme';

export const MorphTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // Bright flash in the middle, fading on both ends
  const brightness = interpolate(
    frame,
    [0, 10, 14, 24],
    [0, 0.3, 0.3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scale pulse
  const scale = interpolate(
    frame,
    [0, 12, 24],
    [1.0, 1.05, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(217, 119, 6, ${brightness})`,
        backdropFilter: `blur(${brightness * 16}px)`,
        transform: `scale(${scale})`,
      }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/transitions/MorphTransition.tsx
git commit -m "feat(video): add MorphTransition overlay with blur and scale pulse"
```

---

## Chunk 4: Scene Components (Abstract + Special)

### Task 14: AbstractScene

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/AbstractScene.tsx`

- [ ] **Step 1: Write AbstractScene.tsx**

Renders a Veo 2 MP4 via `<OffthreadVideo>` with optional text overlay and optional TaraAvatar. Handles clip duration mismatches by slowing playback when the scene is significantly longer than the clip.

```typescript
import React, { useState } from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TextOverlay } from '../components/TextOverlay';
import { TaraAvatar } from '../components/TaraAvatar';
import { theme, fonts, FPS, WIDTH, HEIGHT } from '../theme';

interface AbstractSceneProps {
  clip: string;
  textOverlay?: string;
  showAvatar?: boolean;
}

// Veo 2 clips are ~8s. For scenes longer than this, slow playback to fill.
const VEO2_CLIP_DURATION_S = 8;

export const AbstractScene: React.FC<AbstractSceneProps> = ({
  clip,
  textOverlay,
  showAvatar = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const [error, setError] = useState(false);

  if (error || !clip) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: 'magenta',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 32,
          color: 'white',
        }}
      >
        MISSING: {clip || 'no clip specified'}
      </AbsoluteFill>
    );
  }

  // Slow playback for scenes longer than clip duration
  const sceneDurationS = durationInFrames / FPS;
  const playbackRate = sceneDurationS > VEO2_CLIP_DURATION_S
    ? VEO2_CLIP_DURATION_S / sceneDurationS
    : 1;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(`veo2/${clip}`)}
        playbackRate={playbackRate}
        style={{ width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
        onError={() => setError(true)}
      />
      {textOverlay && (
        <TextOverlay
          text={textOverlay}
          fontSize={40}
          fontFamily={fonts.sans}
          color={theme.text.primary}
          withBackground
          delay={15}
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        />
      )}
      {showAvatar && <TaraAvatar />}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/AbstractScene.tsx
git commit -m "feat(video): add AbstractScene with OffthreadVideo and error fallback"
```

---

### Task 15: ThesisScene (06c_thesis_closer)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/ThesisScene.tsx`

- [ ] **Step 1: Write ThesisScene.tsx**

Per spec keyframes — 51 frames, 3 overlapping animations:

```typescript
import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, spring, interpolate } from 'remotion';
import { TaraAvatar } from '../components/TaraAvatar';
import { StarMotif } from '../components/StarMotif';
import { theme, springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

export const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text: frames 0-15, spring snappy
  const textProgress = spring({
    frame,
    fps: FPS,
    config: springs.snappy,
  });
  const textY = interpolate(textProgress, [0, 1], [10, 0]);

  return (
    <AbsoluteFill>
      {/* Veo 2 background */}
      <OffthreadVideo
        src={staticFile('veo2/06c_tara_reveal_v2.mp4')}
        style={{ width: WIDTH, height: HEIGHT, objectFit: 'cover' }}
      />

      {/* Dark overlay for text legibility */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />

      {/* "Tara closes that gap." */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.serif,
          fontSize: 64,
          color: theme.text.primary,
          opacity: textProgress,
          transform: `translateY(${textY}px)`,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        Tara closes that gap.
      </div>

      {/* StarMotif: fires at frame 10, compressed stagger (5 frames) */}
      <StarMotif x={WIDTH / 2 - 200} y={HEIGHT / 2 - 40} delay={10} ringStagger={5} />

      {/* Avatar: enters at frame 20, bottom-right */}
      <TaraAvatar delay={20} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/ThesisScene.tsx
git commit -m "feat(video): add ThesisScene with star burst and avatar entrance"
```

---

### Task 16: MetricsScene (15_metrics)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/MetricsScene.tsx`

- [ ] **Step 1: Write MetricsScene.tsx**

Per spec: 170 frames, animated counters 0→400 and 1x→2x, tagline fade-in.

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, fonts, FPS } from '../theme';

export const MetricsScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Title: "The Numbers" — frames 0-20
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Counter 1: 0 → 400 — frames 20-90
  const counter1Progress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.slow,
  });
  const counter1Value = Math.round(counter1Progress * 400);

  // Counter 2: 1 → 2 — frames 50-120
  const counter2Progress = spring({
    frame: Math.max(0, frame - 50),
    fps: FPS,
    config: springs.slow,
  });
  const counter2Value = (1 + counter2Progress).toFixed(1);

  // Tagline: "Minutes, not days." — frames 100-150
  const taglineOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [100, 130], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Amber glow pulse on counters: frames 150-170
  const glowAlpha = frame >= 150
    ? interpolate(frame, [150, 160, 170], [0, 0.3, 0], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.canvas.dark }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.sans,
          fontSize: 28,
          color: theme.text.muted,
          opacity: titleOpacity,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}
      >
        The Numbers
      </div>

      {/* Counter 1: Threads */}
      <div
        style={{
          position: 'absolute',
          left: 480,
          top: 400,
          textAlign: 'center',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 'bold',
            fontSize: 120,
            color: theme.amber.primary,
            textShadow: `0 0 ${glowAlpha * 40}px ${theme.amber.primary}`,
          }}
        >
          {counter1Value}+
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 24,
            color: theme.text.secondary,
            marginTop: 8,
          }}
        >
          Threads resolved
        </div>
      </div>

      {/* Counter 2: PR throughput */}
      <div
        style={{
          position: 'absolute',
          left: 1440,
          top: 400,
          textAlign: 'center',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 'bold',
            fontSize: 120,
            color: theme.accent.green,
            textShadow: `0 0 ${glowAlpha * 40}px ${theme.accent.green}`,
          }}
        >
          {counter2Value}x
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 24,
            color: theme.text.secondary,
            marginTop: 8,
          }}
        >
          PR throughput
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          top: 700,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.serif,
          fontSize: 48,
          color: theme.text.primary,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Minutes, not days.
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/MetricsScene.tsx
git commit -m "feat(video): add MetricsScene with animated counters and tagline"
```

---

### Task 17: BuildersScene (18_builders)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/BuildersScene.tsx`

- [ ] **Step 1: Write BuildersScene.tsx**

Per spec: 59 frames, word-by-word kinetic text with blur entrance.

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { theme, springs, fonts, FPS } from '../theme';

const WORDS: { text: string; delay: number; color: string; inline?: boolean }[] = [
  { text: 'Engineers', delay: 0, color: theme.text.primary },
  { text: 'are', delay: 12, color: theme.text.primary },
  { text: 'builders', delay: 24, color: theme.amber.primary },
  { text: 'now.', delay: 40, color: theme.text.primary, inline: true },
];

export const BuildersScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.canvas.dark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {WORDS.map((word, i) => {
        const adjusted = Math.max(0, frame - word.delay);
        const progress = spring({
          frame: adjusted,
          fps: FPS,
          config: springs.snappy,
        });
        const blur = interpolate(progress, [0, 1], [8, 0]);
        const opacity = progress;

        // "now." appears inline after "builders"
        if (word.inline) {
          return null; // Rendered inline below
        }

        return (
          <div
            key={i}
            style={{
              fontFamily: fonts.serif,
              fontSize: 72,
              color: word.color,
              opacity,
              filter: `blur(${blur}px)`,
              lineHeight: 1.3,
            }}
          >
            {word.text}
            {/* Render "now." inline after "builders" */}
            {word.text === 'builders' && (() => {
              const nowAdj = Math.max(0, frame - 40);
              const nowProg = spring({
                frame: nowAdj,
                fps: FPS,
                config: springs.gentle,
              });
              return (
                <span
                  style={{
                    color: theme.text.primary,
                    opacity: nowProg,
                    marginLeft: 16,
                  }}
                >
                  now.
                </span>
              );
            })()}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/BuildersScene.tsx
git commit -m "feat(video): add BuildersScene with kinetic text blur entrance"
```

---

### Task 18: TaglineScene (21_tagline)

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/TaglineScene.tsx`

- [ ] **Step 1: Write TaglineScene.tsx**

86 frames total. Star → "TARA" → "Build what matters."

```typescript
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { StarMotif } from '../components/StarMotif';
import { theme, springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Star: frames 0-30
  // (StarMotif handles its own spring animation)

  // "TARA": frames 20-50
  const taraProgress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.snappy,
  });

  // "Build what matters.": frames 40-70
  const taglineProgress = spring({
    frame: Math.max(0, frame - 40),
    fps: FPS,
    config: springs.gentle,
  });
  const taglineY = interpolate(taglineProgress, [0, 1], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.canvas.dark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Star logo */}
      <StarMotif x={WIDTH / 2} y={HEIGHT / 2 - 100} size={100} ringStagger={8} />

      {/* "TARA" */}
      <div
        style={{
          position: 'absolute',
          top: HEIGHT / 2 + 20,
          fontFamily: fonts.sans,
          fontWeight: 'bold',
          fontSize: 72,
          color: theme.text.primary,
          letterSpacing: 16,
          opacity: taraProgress,
          transform: `scale(${0.9 + taraProgress * 0.1})`,
        }}
      >
        TARA
      </div>

      {/* "Build what matters." */}
      <div
        style={{
          position: 'absolute',
          top: HEIGHT / 2 + 110,
          fontFamily: fonts.serif,
          fontSize: 32,
          color: theme.text.secondary,
          opacity: taglineProgress,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Build what matters.
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/TaglineScene.tsx
git commit -m "feat(video): add TaglineScene with star logo and tagline reveal"
```

---

## Chunk 5: ScreenshotScene + Full Composition

### Task 19: ScreenshotScene

**Files:**
- Create: `docs/plans/video-production/v7/remotion-v2/src/scenes/ScreenshotScene.tsx`

- [ ] **Step 1: Write ScreenshotScene.tsx**

This is the most complex component. It renders a PNG background and dispatches to per-scene animation keyframes. Overlay regions are positioned absolutely and animated frame-by-frame.

```typescript
import React, { useState } from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  spring,
  interpolate,
} from 'remotion';
import { TypingCursor } from '../components/TypingCursor';
import { TaraAvatar } from '../components/TaraAvatar';
import { theme, springs, fonts, FPS, WIDTH, HEIGHT } from '../theme';

interface ScreenshotSceneProps {
  sceneId: string;
  screenshot: string;
}

export const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  sceneId,
  screenshot,
}) => {
  const frame = useCurrentFrame();
  const [error, setError] = useState(false);

  if (error) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: 'magenta',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 32,
          color: 'white',
        }}
      >
        MISSING: {screenshot}
      </AbsoluteFill>
    );
  }

  const anim = getAnimations(sceneId, frame);

  return (
    <AbsoluteFill>
      {/* Screenshot background with optional zoom/pan */}
      <div
        style={{
          position: 'absolute',
          width: WIDTH,
          height: HEIGHT,
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(`screenshots/${screenshot}`)}
          style={{
            width: WIDTH,
            height: HEIGHT,
            objectFit: 'cover',
            transform: `scale(${anim.bgScale}) translateY(${anim.bgTranslateY}%)`,
          }}
          onError={() => setError(true)}
        />
      </div>

      {/* Subtle dark vignette for polish */}
      <div
        style={{
          position: 'absolute',
          width: WIDTH,
          height: HEIGHT,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Animated overlays */}
      {anim.overlays.map((overlay, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...overlay.style,
          }}
        />
      ))}

      {/* Typing cursor if scene uses it */}
      {anim.cursor && (
        <TypingCursor
          x={anim.cursor.x}
          y={anim.cursor.y}
          path={anim.cursor.path}
        />
      )}

      {/* Avatar on select scenes */}
      {anim.showAvatar && <TaraAvatar delay={10} />}
    </AbsoluteFill>
  );
};

interface OverlayDef {
  style: React.CSSProperties;
}

interface AnimResult {
  bgScale: number;
  bgTranslateY: number;
  overlays: OverlayDef[];
  cursor?: { x: number; y: number; path?: [number, number, number][] };
  showAvatar: boolean;
}

function getAnimations(sceneId: string, frame: number): AnimResult {
  switch (sceneId) {
    case '04_history':
      return history(frame);
    case '07_slack_thread':
      return slackThread(frame);
    case '08_investigation':
      return investigation(frame);
    case '10_team_collab':
      return teamCollab(frame);
    case '11a_plan_forms':
      return planForms(frame);
    case '12a_execution':
      return execution(frame);
    case '12b_prs':
      return prs(frame);
    case '13_ecosystem':
      return ecosystem(frame);
    default:
      return { bgScale: 1, bgTranslateY: 0, overlays: [], showAvatar: false };
  }
}

// --- Per-scene animation functions ---
// Each returns overlay divs positioned over specific regions.
// Bounding box coordinates are approximate — refine by visual inspection in Remotion Studio.

function history(frame: number): AnimResult {
  // Pan from top + gentle zoom
  const panY = interpolate(frame, [0, 30], [-2, 0], { extrapolateRight: 'clamp' });
  const zoomIn = interpolate(frame, [0, 30], [1.02, 1.0], { extrapolateRight: 'clamp' });
  const zoomLate = interpolate(frame, [240, 367], [1.0, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bgScale = frame < 240 ? zoomIn : zoomLate;

  // Message blocks fade in with spring gentle
  const msg1Progress = spring({
    frame: Math.max(0, frame - 30),
    fps: FPS,
    config: springs.gentle,
  });
  const msg1Opacity = msg1Progress;
  const msg1Y = interpolate(msg1Progress, [0, 1], [10, 0]);

  // Code highlight pulse
  const codeGlow = frame >= 90 && frame <= 150
    ? interpolate(frame, [90, 120, 150], [0, 0.4, 0], { extrapolateRight: 'clamp' })
    : 0;

  // Second message with spring gentle
  const msg2Progress = spring({
    frame: Math.max(0, frame - 150),
    fps: FPS,
    config: springs.gentle,
  });
  const msg2Opacity = msg2Progress;

  return {
    bgScale,
    bgTranslateY: panY,
    overlays: [
      {
        style: {
          left: 100, top: 300, width: 700, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${msg1Opacity * 0.08})`,
          borderLeft: `3px solid rgba(217, 119, 6, ${msg1Opacity * 0.6})`,
          borderRadius: 4,
          transform: `translateY(${msg1Y}px)`,
        },
      },
      {
        style: {
          left: 100, top: 500, width: 800, height: 100,
          boxShadow: `0 0 20px rgba(217, 119, 6, ${codeGlow})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 650, width: 700, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${msg2Opacity * 0.08})`,
          borderLeft: `3px solid rgba(217, 119, 6, ${msg2Opacity * 0.6})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 120,
      y: 320,
      path: [
        [0, 120, 320],
        [150, 120, 520],
        [240, 120, 670],
      ],
    },
    showAvatar: true,
  };
}

function slackThread(frame: number): AnimResult {
  // Search bar glow
  const searchGlow = interpolate(frame, [0, 20], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Results slide in with spring physics
  const result1Progress = spring({
    frame: Math.max(0, frame - 20),
    fps: FPS,
    config: springs.snappy,
  });
  const result1X = interpolate(result1Progress, [0, 1], [-20, 0]);
  const result1Opacity = result1Progress;

  const result2Progress = spring({
    frame: Math.max(0, frame - 35),
    fps: FPS,
    config: springs.snappy,
  });
  const result2X = interpolate(result2Progress, [0, 1], [-20, 0]);
  const result2Opacity = result2Progress;

  // Hover highlight
  const hoverOpacity = interpolate(frame, [140, 160], [0, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle zoom
  const bgScale = interpolate(frame, [180, 241], [1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 300, top: 80, width: 600, height: 50,
          boxShadow: `0 0 15px rgba(217, 119, 6, ${searchGlow})`,
          borderRadius: 8,
        },
      },
      {
        style: {
          left: 300, top: 200, width: 600, height: 80,
          opacity: result1Opacity,
          transform: `translateX(${result1X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.05)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 300, top: 300, width: 600, height: 80,
          opacity: result2Opacity,
          transform: `translateX(${result2X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.05)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 300, top: 200, width: 600, height: 80,
          backgroundColor: `rgba(255, 255, 255, ${hoverOpacity})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 500,
      y: 100,
      path: [
        [0, 500, 100],
        [100, 500, 230],
        [140, 500, 230],
      ],
    },
    showAvatar: true,
  };
}

function investigation(frame: number): AnimResult {
  // Bot header fade
  const headerOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Lines reveal via clipPath
  const linesRevealed = Math.floor(interpolate(frame, [40, 120], [0, 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  // Code highlight
  const codeHighlight = interpolate(frame, [120, 160], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Badges stagger with spring bouncy
  const badge1 = spring({ frame: Math.max(0, frame - 180), fps: FPS, config: springs.bouncy });
  const badge2 = spring({ frame: Math.max(0, frame - 195), fps: FPS, config: springs.bouncy });
  const badge3 = spring({ frame: Math.max(0, frame - 210), fps: FPS, config: springs.bouncy });

  // Slow scroll
  const scrollY = interpolate(frame, [240, 373], [0, -3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: 1,
    bgTranslateY: scrollY,
    overlays: [
      // Bot header
      {
        style: {
          left: 100, top: 100, width: 500, height: 60,
          backgroundColor: `rgba(217, 119, 6, ${headerOpacity * 0.1})`,
          borderRadius: 8,
        },
      },
      // Response lines (revealed progressively)
      ...Array.from({ length: 4 }, (_, i) => ({
        style: {
          left: 100,
          top: 180 + i * 50,
          width: 700,
          height: 40,
          backgroundColor: `rgba(217, 119, 6, ${i < linesRevealed ? 0.06 : 0})`,
          borderLeft: `2px solid rgba(217, 119, 6, ${i < linesRevealed ? 0.4 : 0})`,
          borderRadius: 4,
          transition: 'none',
        },
      })),
      // Code block highlight
      {
        style: {
          left: 120, top: 400, width: 660, height: 80,
          borderLeft: `3px solid rgba(217, 119, 6, ${codeHighlight})`,
          borderRadius: 4,
        },
      },
      // Badges
      ...[badge1, badge2, badge3].map((opacity, i) => ({
        style: {
          left: 100 + i * 200,
          top: 520,
          width: 160,
          height: 36,
          backgroundColor: `rgba(74, 222, 128, ${opacity * 0.15})`,
          border: `1px solid rgba(74, 222, 128, ${opacity * 0.5})`,
          borderRadius: 18,
        },
      })),
    ],
    showAvatar: true,
  };
}

function teamCollab(frame: number): AnimResult {
  // Replies appear with spring gentle
  const reply1Progress = spring({ frame, fps: FPS, config: springs.gentle });
  const reply1X = interpolate(reply1Progress, [0, 1], [-20, 0]);
  const reply1Opacity = reply1Progress;

  // Diff highlights
  const diffHighlight = interpolate(frame, [45, 90], [0, 0.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Second reply with spring gentle
  const reply2Progress = spring({ frame: Math.max(0, frame - 90), fps: FPS, config: springs.gentle });
  const reply2Opacity = reply2Progress;

  // Green diff pulse
  const greenPulse = frame >= 150 && frame <= 210
    ? interpolate(frame, [150, 180, 210], [0, 0.8, 0.5], { extrapolateRight: 'clamp' })
    : 0;

  // Zoom
  const bgScale = interpolate(frame, [210, 326], [1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 80, top: 200, width: 700, height: 100,
          opacity: reply1Opacity,
          transform: `translateX(${reply1X}px)`,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 400, width: 650, height: 120,
          backgroundColor: `rgba(217, 119, 6, ${diffHighlight})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 80, top: 550, width: 700, height: 100,
          opacity: reply2Opacity,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, 0.4)`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 120, top: 420, width: 600, height: 30,
          backgroundColor: `rgba(74, 222, 128, ${greenPulse * 0.15})`,
          borderLeft: `3px solid rgba(74, 222, 128, ${greenPulse})`,
          borderRadius: 2,
        },
      },
    ],
    showAvatar: true,
  };
}

function planForms(frame: number): AnimResult {
  // Header zoom
  const headerScale = interpolate(frame, [0, 60], [0.98, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerOpacity = interpolate(frame, [0, 60], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Metric highlights (3 metrics, staggered 20 frames)
  const metrics = [0, 1, 2].map(i => {
    const start = 60 + i * 20;
    const glow = frame >= start && frame <= start + 40
      ? interpolate(frame, [start, start + 20, start + 40], [0, 0.4, 0.1], { extrapolateRight: 'clamp' })
      : 0;
    return glow;
  });

  // Scroll
  const scrollY = interpolate(frame, [120, 180], [0, -4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Header glow
  const headerGlow = interpolate(frame, [180, 210], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: headerScale,
    bgTranslateY: scrollY,
    overlays: [
      {
        style: {
          left: 200, top: 100, width: 600, height: 60,
          opacity: headerOpacity,
          borderRadius: 4,
        },
      },
      ...metrics.map((glow, i) => ({
        style: {
          left: 200 + i * 250,
          top: 350,
          width: 200,
          height: 80,
          boxShadow: `0 0 20px rgba(217, 119, 6, ${glow})`,
          borderRadius: 8,
        },
      })),
      {
        style: {
          left: 200, top: 250, width: 500, height: 3,
          backgroundColor: `rgba(217, 119, 6, ${headerGlow})`,
        },
      },
    ],
    showAvatar: false,
  };
}

function execution(frame: number): AnimResult {
  // Editor chrome fade
  const chromeOpacity = interpolate(frame, [0, 30], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Code lines type in (6 lines, 15 frames each via clipPath-like width reveal)
  const linesTyped = Math.floor(interpolate(frame, [30, 120], [0, 6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  // Terminal pane
  const terminalOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const terminalY = interpolate(frame, [60, 100], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tab switch
  const tab1Active = frame < 120 ? 0.3 : 0;
  const tab2Active = frame >= 120 ? 0.3 : 0;

  return {
    bgScale: 1,
    bgTranslateY: 0,
    overlays: [
      // Chrome opacity
      {
        style: {
          left: 0, top: 0, width: WIDTH, height: 40,
          opacity: chromeOpacity,
        },
      },
      // Code lines revealed
      ...Array.from({ length: 6 }, (_, i) => ({
        style: {
          left: 250,
          top: 120 + i * 35,
          width: i < linesTyped ? 500 : 0,
          height: 24,
          backgroundColor: `rgba(217, 119, 6, 0.06)`,
          borderLeft: `2px solid rgba(217, 119, 6, ${i < linesTyped ? 0.3 : 0})`,
          borderRadius: 2,
          overflow: 'hidden' as const,
        },
      })),
      // Terminal pane
      {
        style: {
          left: 200, top: 700, width: 800, height: 200,
          opacity: terminalOpacity,
          transform: `translateY(${terminalY}px)`,
          backgroundColor: `rgba(0, 0, 0, 0.1)`,
          borderTop: '1px solid rgba(217, 119, 6, 0.2)',
          borderRadius: 4,
        },
      },
      // Tab highlights
      {
        style: {
          left: 250, top: 8, width: 120, height: 28,
          backgroundColor: `rgba(217, 119, 6, ${tab1Active})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 380, top: 8, width: 120, height: 28,
          backgroundColor: `rgba(217, 119, 6, ${tab2Active})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 260,
      y: 130,
      path: [
        [0, 260, 130],
        [60, 760, 130],
        [120, 260, 250],
        [200, 760, 250],
      ],
    },
    showAvatar: true,
  };
}

function prs(frame: number): AnimResult {
  // Progress bar 1: 0-45
  const bar1Width = interpolate(frame, [0, 45], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark 1: 45-75
  const check1Scale = frame >= 45
    ? spring({ frame: frame - 45, fps: FPS, config: springs.bouncy })
    : 0;

  // Progress bar 2: 45-90
  const bar2Width = interpolate(frame, [45, 90], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark 2: 90-120
  const check2Scale = frame >= 90
    ? spring({ frame: frame - 90, fps: FPS, config: springs.bouncy })
    : 0;

  // Status glow: 135-185
  const statusGlow = interpolate(frame, [135, 160, 185], [0, 0.4, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale: 1,
    bgTranslateY: 0,
    overlays: [
      // Progress bar 1
      {
        style: {
          left: 300, top: 350, width: `${bar1Width}%`,
          maxWidth: 500,
          height: 12,
          backgroundColor: theme.accent.green,
          borderRadius: 6,
          opacity: 0.7,
        },
      },
      // Checkmark 1
      {
        style: {
          left: 820, top: 340,
          width: 30, height: 30,
          borderRadius: '50%',
          backgroundColor: `rgba(74, 222, 128, ${check1Scale * 0.3})`,
          border: `2px solid rgba(74, 222, 128, ${check1Scale})`,
          transform: `scale(${check1Scale})`,
        },
      },
      // Progress bar 2
      {
        style: {
          left: 300, top: 450, width: `${bar2Width}%`,
          maxWidth: 500,
          height: 12,
          backgroundColor: theme.accent.green,
          borderRadius: 6,
          opacity: 0.7,
        },
      },
      // Checkmark 2
      {
        style: {
          left: 820, top: 440,
          width: 30, height: 30,
          borderRadius: '50%',
          backgroundColor: `rgba(74, 222, 128, ${check2Scale * 0.3})`,
          border: `2px solid rgba(74, 222, 128, ${check2Scale})`,
          transform: `scale(${check2Scale})`,
        },
      },
      // Status glow
      {
        style: {
          left: 300, top: 550, width: 500, height: 40,
          boxShadow: `0 0 20px rgba(74, 222, 128, ${statusGlow})`,
          borderRadius: 8,
        },
      },
    ],
    showAvatar: true,
  };
}

function ecosystem(frame: number): AnimResult {
  // Config blocks highlight sequentially
  const block1 = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const block2 = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Zoom out
  const bgScale = interpolate(frame, [90, 129], [1.02, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    bgScale,
    bgTranslateY: 0,
    overlays: [
      {
        style: {
          left: 100, top: 250, width: 700, height: 100,
          borderLeft: `3px solid rgba(217, 119, 6, ${block1 * 0.6})`,
          backgroundColor: `rgba(217, 119, 6, ${block1 * 0.06})`,
          borderRadius: 4,
        },
      },
      {
        style: {
          left: 100, top: 380, width: 700, height: 100,
          borderLeft: `3px solid rgba(217, 119, 6, ${block2 * 0.6})`,
          backgroundColor: `rgba(217, 119, 6, ${block2 * 0.06})`,
          borderRadius: 4,
        },
      },
    ],
    cursor: {
      x: 130,
      y: 270,
      path: [
        [0, 130, 270],
        [30, 130, 400],
        [60, 500, 400],
        [90, 500, 270],
      ],
    },
    showAvatar: false,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/scenes/ScreenshotScene.tsx
git commit -m "feat(video): add ScreenshotScene with 8 per-scene animation keyframes"
```

---

### Task 20: Wire everything into TaraVideo.tsx

**Files:**
- Modify: `docs/plans/video-production/v7/remotion-v2/src/TaraVideo.tsx`

- [ ] **Step 1: Update TaraVideo.tsx with scene routing and transitions**

Replace the minimal TaraVideo.tsx with the full composition:

```typescript
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { theme, FPS } from './theme';
import { SCENES, SceneEntry } from './timing';
import { AbstractScene } from './scenes/AbstractScene';
import { ScreenshotScene } from './scenes/ScreenshotScene';
import { ThesisScene } from './scenes/ThesisScene';
import { MetricsScene } from './scenes/MetricsScene';
import { BuildersScene } from './scenes/BuildersScene';
import { TaglineScene } from './scenes/TaglineScene';
import { ThreadTransition } from './transitions/ThreadTransition';
import { FadeBlackTransition } from './transitions/FadeBlackTransition';
import { MorphTransition } from './transitions/MorphTransition';

const musicVolume = (frame: number): number => {
  const t = frame / FPS;
  if (t < 2) return interpolate(t, [0, 2], [0, 0.12]);
  if (t < 15) return 0.12;
  if (t < 34) return 0.15;
  if (t < 36) return 0.08;
  if (t < 55) return 0.18;
  if (t < 58) return 0.10;
  if (t < 78) return 0.15;
  if (t < 96) return 0.12;
  if (t < 123) return 0.18;
  if (t < 130) return 0.08;
  if (t < 136) return 0.22;
  if (t < 140) return 0.20;
  return interpolate(t, [140, 146], [0.15, 0], { extrapolateRight: 'clamp' });
};

const SceneRouter: React.FC<{ scene: SceneEntry }> = ({ scene }) => {
  switch (scene.category) {
    case 'abstract':
      return <AbstractScene clip={scene.asset} textOverlay={scene.textOverlay} />;
    case 'screenshot':
      return <ScreenshotScene sceneId={scene.id} screenshot={scene.asset} />;
    case 'special':
      if (scene.id === '06c_thesis_closer') return <ThesisScene />;
      if (scene.id === '15_metrics') return <MetricsScene />;
      if (scene.id === '18_builders') return <BuildersScene />;
      return <AbstractScene clip={scene.asset} />;
    case 'closing':
      return <TaglineScene />;
  }
};

const TransitionRouter: React.FC<{ to: SceneEntry }> = ({ to }) => {
  switch (to.transition) {
    case 'fadeBlack':
      return <FadeBlackTransition />;
    case 'morph':
      return <MorphTransition />;
    case 'thread':
    default:
      return <ThreadTransition />;
  }
};

export const TaraVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.canvas.dark }}>
      {/* Audio layers */}
      <Audio src={staticFile('voiceover/tara-v7-newvoice_v1.mp3')} />
      <Audio src={staticFile('music/tara_v74_music.wav')} volume={musicVolume} />

      {/* Scene sequences */}
      {SCENES.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneRouter scene={scene} />
        </Sequence>
      ))}

      {/* Transition overlays */}
      {SCENES.slice(1).map((scene, i) => {
        const prev = SCENES[i];
        const overlapStart = prev.startFrame + prev.durationFrames - 12;
        return (
          <Sequence
            key={`transition-${scene.id}`}
            from={overlapStart}
            durationInFrames={24}
          >
            <TransitionRouter to={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify in Remotion Studio**

```bash
cd docs/plans/video-production/v7/remotion-v2 && npm start
```

Expected: All 24 scenes render in sequence. Abstract scenes show Veo 2 clips. Screenshot scenes show PNGs with animated overlays. Audio plays in sync. Transitions appear as overlays between scenes.

- [ ] **Step 3: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/TaraVideo.tsx
git commit -m "feat(video): wire all scenes, transitions, and audio into TaraVideo composition"
```

---

## Chunk 6: Polish + Render

### Task 21: Visual tuning pass

**Files:**
- Modify: `docs/plans/video-production/v7/remotion-v2/src/scenes/ScreenshotScene.tsx` (overlay coordinates)

This is an interactive task. Use Remotion Studio to:

- [ ] **Step 1: Scrub through each screenshot scene and adjust overlay bounding boxes**

For each of the 8 screenshot scenes, pause on the scene in Remotion Studio and adjust the `left`, `top`, `width`, `height` values in the per-scene animation functions to align with actual UI elements in the PNG. The initial values are approximate — this step makes them pixel-perfect.

- [ ] **Step 2: Adjust transition timing if needed**

Check each of the 7 non-default transitions (2 FadeBlack, 3 Morph, 2 special Thread). Verify the 24-frame overlap window feels right. Adjust `drawDuration` on AmberThread if the thread draws too fast/slow.

- [ ] **Step 3: Verify avatar positioning**

Confirm TaraAvatar doesn't overlap important UI elements in screenshot scenes. Adjust position if needed.

- [ ] **Step 4: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/src/
git commit -m "fix(video): tune overlay positions and transition timing from visual review"
```

---

### Task 22: Draft render + verification

- [ ] **Step 1: Render draft quality**

```bash
cd docs/plans/video-production/v7/remotion-v2 && npm run render:draft
```

Expected: `out/tara_v2_draft.mp4` created. File should be ~20-50MB. No render errors.

- [ ] **Step 2: Watch the full draft video**

Play `out/tara_v2_draft.mp4` end-to-end. Check for:
- Audio sync (voiceover matches scenes)
- No black frames between scenes
- All screenshot overlays are visible
- Transitions are smooth
- Avatar appears on correct scenes
- No magenta error frames

- [ ] **Step 3: Production render**

```bash
cd docs/plans/video-production/v7/remotion-v2 && npm run render
```

Expected: `out/tara_v2.mp4` created. Higher quality, larger file.

- [ ] **Step 4: Commit**

```bash
git add docs/plans/video-production/v7/remotion-v2/
git commit -m "feat(video): Remotion V2 complete — all 24 scenes, transitions, audio"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Scaffold | 1-5 | Working Remotion project with audio playback |
| 2: Components | 6-10 | 5 reusable animated components |
| 3: Transitions | 11-13 | 3 transition types |
| 4: Scenes (Abstract+Special) | 14-18 | 5 scene components (Abstract, Thesis, Metrics, Builders, Tagline) |
| 5: Screenshots + Wiring | 19-20 | ScreenshotScene with 8 animations + full composition |
| 6: Polish + Render | 21-22 | Visual tuning + rendered output |

**Total: 22 tasks across 6 chunks.**

Each chunk produces a commit-worthy milestone. Chunks 1-3 can be built without visual verification (pure code). Chunks 4-5 require Remotion Studio for visual checks. Chunk 6 is the final polish pass.

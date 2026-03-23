# Remotion V2 Video Rebuild — Design Spec

**Date:** 2026-03-12
**Goal:** Break past the 6.5 Gemini score ceiling by replacing the FFmpeg assembly pipeline with a Remotion-based motion graphics system.
**Location:** `docs/plans/video-production/v7/remotion-v2/`

## Problem Statement

After 18 iterations of FFmpeg-based video assembly, the Tara product video is stuck at 6.5/10 (Gemini 2.5 Pro analysis). The root causes are structural:

1. **Transitions flow locked at 5/10** — FFmpeg xfade creates "stitched clips" feel, not continuous motion
2. **Static UI screenshots** — Ken Burns pan/zoom on PNGs flagged as "slide deck" in every iteration
3. **No unified visual motif** — mixed styles (Veo 2 abstract + Ken Burns screenshots) don't blend

These cannot be fixed with FFmpeg filters. They require programmatic animation — React components with spring physics, typed reveals, and custom transition overlays.

## Scene Order (Linear Sequence)

The 24 scenes play in this exact order. Durations are **gross** — each scene renders for this many seconds. There are **no transition overlaps subtracted** from scene durations. Instead, transitions are rendered as a separate overlay layer on top of adjacent scenes (both scenes render simultaneously during the overlap window). The total composition duration equals the sum of all scene durations = 146.16s.

| # | Scene ID | Category | Duration | Cumulative Start | Clip / Asset |
|---|----------|----------|----------|-----------------|-------------|
| 1 | 01_opening | Abstract | 8.78s | 0.00s | 01_opening_v2.mp4 |
| 2 | 03_gap | Abstract | 6.52s | 8.78s | 03_gap_v2.mp4 |
| 3 | 04_history | Screenshot | 12.24s | 15.30s | race-condition-confirmed.png |
| 4 | 05_weight | Abstract | 6.92s | 27.54s | 05_weight_v2.mp4 |
| 5 | bridge_weight_thesis | Abstract | 2.00s | 34.46s | bridge_weight_to_thesis_v2.mp4 |
| 6 | 06a_thesis_rise | Abstract | 8.68s | 36.46s | 06_thesis_v2.mp4 |
| 7 | 06b_thesis_friction | Abstract | 10.56s | 45.14s | 06b_friction_v2.mp4 |
| 8 | 06c_thesis_closer | Special | 1.70s | 55.70s | 06c_tara_reveal_v2.mp4 |
| 9 | transition_to_slack | Abstract | 1.00s | 57.40s | bridge_thesis_to_slack_v2.mp4 |
| 10 | 07_slack_thread | Screenshot | 8.03s | 58.40s | tara-slack-search.png |
| 11 | 08_investigation | Screenshot | 12.42s | 66.43s | bug-fix-tara-response.png |
| 12 | 10_team_collab | Screenshot | 10.87s | 78.85s | async-loop-yaswanth-review.png |
| 13 | 11a_plan_forms | Screenshot | 7.00s | 89.72s | tara-jira-pdf-report.png |
| 14 | 11b_plan_moves | Abstract | 6.79s | 96.72s | 11_plan_forms_v3.mp4 |
| 15 | 12a_execution | Screenshot | 9.24s | 103.51s | coding-agent-implementing.png |
| 16 | 12b_prs | Screenshot | 6.16s | 112.75s | coding-agent-progress.png |
| 17 | 13_ecosystem | Screenshot | 4.30s | 118.91s | vinay-backend-configs.png |
| 18 | 14_integrations | Abstract | 5.36s | 123.21s | 14_tara_connects_v2.mp4 |
| 19 | bridge_demo_impact | Abstract | 1.50s | 128.57s | bridge_demo_to_impact_v2.mp4 |
| 20 | 15_metrics | Special | 5.65s | 130.07s | 15_metrics_v2.mp4 (bg only) |
| 21 | 17_future | Abstract | 1.81s | 135.72s | 17_future_v2.mp4 |
| 22 | 18_builders | Special | 1.95s | 137.53s | 18_builders_v2.mp4 (bg only) |
| 23 | 19_constellation | Abstract | 3.81s | 139.48s | 19_constellation_v2.mp4 |
| 24 | 21_tagline | Closing | 2.87s | 143.29s | — (dark bg) |

**Scene numbering gaps** (02, 09, 16, 20) are intentional — these scenes were removed in earlier editing passes. The IDs match the original voiceover timing map for traceability.

## Architecture

### Project Structure

```
docs/plans/video-production/v7/remotion-v2/
├── package.json              # remotion 4.0.x, react 19, typescript
├── tsconfig.json
├── remotion.config.ts
├── public/
│   ├── voiceover/            # symlink → ../../assets/voiceover/v7/
│   ├── music/                # symlink → ../../assets/music/
│   ├── avatar/               # symlink → ../../../assets/avatar/
│   ├── screenshots/          # symlink → ../../../assets/screenshots/
│   └── veo2/                 # symlink → ../../output/veo3/
├── src/
│   ├── Root.tsx              # Registers TaraVideoV2 composition
│   ├── TaraVideo.tsx         # Main: audio layers + scene sequencing
│   ├── theme.ts              # Colors, fonts, springs
│   ├── timing.ts             # 24 scene boundaries (from timing map)
│   ├── scenes/
│   │   ├── AbstractScene.tsx     # Veo 2 background + optional text overlay
│   │   ├── ScreenshotScene.tsx   # Animated UI (PNG bg + overlays)
│   │   ├── MetricsScene.tsx      # Animated counters
│   │   ├── BuildersScene.tsx     # Kinetic text transformation
│   │   ├── ThesisScene.tsx       # "Tara closes that gap" brand reveal
│   │   └── TaglineScene.tsx      # Final logo + tagline
│   ├── components/
│   │   ├── TaraAvatar.tsx        # Animated avatar with glow
│   │   ├── AmberThread.tsx       # Connecting thread motif
│   │   ├── SlackMessage.tsx      # Animated message bubble
│   │   ├── TypingCursor.tsx      # Blinking green cursor
│   │   ├── TextOverlay.tsx       # Spring-animated text
│   │   └── StarMotif.tsx         # Brand star for transitions
│   └── transitions/
│       ├── ThreadTransition.tsx  # Amber thread draws between scenes
│       ├── FadeBlackTransition.tsx
│       └── MorphTransition.tsx   # Scale + blur dissolve
└── out/
```

### Scene Categories

**Category 1: Abstract Scenes (12)** — `AbstractScene.tsx`

Generic wrapper: renders a Veo 2 MP4 via `<OffthreadVideo>` at full screen, with optional `TextOverlay` components on top.

| Scene | Clip | Duration | Text Overlay |
|-------|------|----------|-------------|
| 01_opening | 01_opening_v2.mp4 | 8.78s | — |
| 03_gap | 03_gap_v2.mp4 | 6.52s | — |
| 05_weight | 05_weight_v2.mp4 | 6.92s | — |
| bridge_weight_thesis | bridge_weight_to_thesis_v2.mp4 | 2.00s | — |
| 06a_thesis_rise | 06_thesis_v2.mp4 | 8.68s | — |
| 06b_thesis_friction | 06b_friction_v2.mp4 | 10.56s | — |
| transition_to_slack | bridge_thesis_to_slack_v2.mp4 | 1.00s | — |
| 11b_plan_moves | 11_plan_forms_v3.mp4 | 6.79s | — |
| 14_integrations | 14_tara_connects_v2.mp4 | 5.36s | "Slack · Bitbucket · JIRA · GitHub" |
| bridge_demo_impact | bridge_demo_to_impact_v2.mp4 | 1.50s | — |
| 17_future | 17_future_v2.mp4 | 1.81s | — |
| 19_constellation | 19_constellation_v2.mp4 | 3.81s | "Right where the conversation started." |

**Category 2: Screenshot Scenes (8)** — `ScreenshotScene.tsx`

The core innovation. Each scene renders a real product PNG at full resolution as background, with animated overlays simulating live UI:

| Scene | Screenshot | Duration | Animations |
|-------|-----------|----------|------------|
| 04_history | race-condition-confirmed.png | 12.24s | Messages fade in sequentially, code highlights, scroll down |
| 07_slack_thread | tara-slack-search.png | 8.03s | Search results slide in, hover highlight, cursor moves |
| 08_investigation | bug-fix-tara-response.png | 12.42s | Bot response types in line-by-line, badges stagger in |
| 10_team_collab | async-loop-yaswanth-review.png | 10.87s | Replies appear with spring pop, diff highlights pulse |
| 11a_plan_forms | tara-jira-pdf-report.png | 7.00s | Document scrolls, metrics highlight, headers glow |
| 12a_execution | coding-agent-implementing.png | 9.24s | Code types in, terminal scrolls, file tabs switch |
| 12b_prs | coding-agent-progress.png | 6.16s | Progress bars fill, checkmarks spring in |
| 13_ecosystem | vinay-backend-configs.png | 4.30s | Config lines highlight sequentially |

Animation technique: The PNG is the background (`<Img>` at full resolution). Semi-transparent div overlays animate on top using frame-based keyframes.

**Overlay positioning:** Animated overlays (message blocks, code regions, progress bars) are positioned over specific regions of each screenshot. Bounding box coordinates (x, y, width, height in pixels at 1920×1080) must be derived from each PNG by the developer during implementation. The keyframes below describe *what* animates and *when* — the *where* comes from visual inspection of each screenshot. Store coordinates in `timing.ts` as a `regions` map per scene ID.

**Per-scene animation keyframes** (frame numbers relative to scene start, at 30fps):

**04_history** (367 frames):
- Frame 0–30: Pan from top of screenshot (translateY: -10% → 0) with gentle zoom (scale: 1.02 → 1.0)
- Frame 30–90: First message block fades in (opacity 0→1, translateY 10→0, spring gentle)
- Frame 90–150: Code snippet region pulses (boxShadow amber glow, 0→0.4→0 alpha)
- Frame 150–240: Second message fades in, TypingCursor moves from line 1 to line 3
- Frame 240–367: Slow zoom into conversation center (scale 1.0→1.03)

**07_slack_thread** (241 frames):
- Frame 0–20: Search bar highlight glow (boxShadow 0→0.5 alpha)
- Frame 20–60: First search result slides in (translateX -20→0, spring snappy)
- Frame 60–100: Second result slides in (stagger +15 frames)
- Frame 100–140: Cursor moves to first result (TypingCursor path animation)
- Frame 140–180: Hover highlight on result (bg opacity 0→0.15)
- Frame 180–241: Gentle zoom toward selected result (scale 1.0→1.02)

**08_investigation** (373 frames):
- Frame 0–40: Bot avatar + name header fades in
- Frame 40–120: Response text reveals line-by-line via clipPath inset (top: 100%→0%, 20 frames per line, 4 lines)
- Frame 120–180: Code block within response highlights (amber border-left fades in)
- Frame 180–240: Status badges stagger in (3 badges, spring bouncy, 15-frame stagger)
- Frame 240–373: Slow scroll down revealing more content (translateY 0→-5%)

**10_team_collab** (326 frames):
- Frame 0–45: First reply message slides in (translateX -20→0)
- Frame 45–90: Code diff region highlights (bg: transparent→rgba(amber, 0.1))
- Frame 90–150: Second reply appears (spring gentle)
- Frame 150–210: Diff line additions pulse green (opacity 0→0.8→0.5)
- Frame 210–326: Third reply + gentle zoom (scale 1.0→1.02)

**11a_plan_forms** (210 frames):
- Frame 0–60: Document header zooms in (scale 0.98→1.0, opacity 0.5→1)
- Frame 60–120: Metric values highlight sequentially (3 metrics, boxShadow pulse, 20-frame stagger)
- Frame 120–180: Smooth scroll down (translateY 0→-8%)
- Frame 180–210: Section header glow (amber border-bottom fades in)

**12a_execution** (277 frames):
- Frame 0–30: Editor chrome (tabs, sidebar) subtly fades in
- Frame 30–120: Code lines type in via clipPath (right: 100%→0%, 15 frames per line, 6 lines)
- Frame 60–120: Terminal pane at bottom scrolls (translateY 20→0, opacity 0→1)
- Frame 120–200: File tab switches (tab 1 deselects, tab 2 highlights)
- Frame 200–277: More code lines appear, cursor blink at end

**12b_prs** (185 frames):
- Frame 0–45: Progress bar 1 fills (width 0%→100%, spring slow, fill color green)
- Frame 45–90: Checkmark 1 springs in (scale 0→1, spring bouncy)
- Frame 45–90: Progress bar 2 fills (staggered start)
- Frame 90–135: Checkmark 2 springs in
- Frame 135–185: Status text changes to "Complete", green glow pulse

**13_ecosystem** (129 frames):
- Frame 0–30: First config block highlights (border-left amber, opacity 0→1)
- Frame 30–60: Second config block highlights (stagger)
- Frame 60–90: TypingCursor moves through highlighted lines
- Frame 90–129: Gentle zoom out to show full config (scale 1.02→1.0)

**Category 3: Special Scenes (3)** — Custom components

| Scene | Component | Duration | Treatment |
|-------|-----------|----------|-----------|
| 06c_thesis_closer | ThesisScene.tsx | 1.70s | See keyframes below |
| 15_metrics | MetricsScene.tsx | 5.65s | See keyframes below |
| 18_builders | BuildersScene.tsx | 1.95s | See keyframes below |

**ThesisScene keyframes** (51 frames):
- Frame 0: Veo 2 bg (`06c_tara_reveal_v2.mp4`) plays full-bleed
- Frame 0–15: "Tara closes that gap." text fades in center (spring snappy, opacity 0→1, translateY 10→0). Font: Playfair Display 64px, white.
- Frame 10–35: StarMotif fires at center-left (scale 0→1 spring bouncy, glow rings staggered 5 frames each — compressed from 8 for tight scene)
- Frame 20–51: TaraAvatar enters bottom-right (scale 0→1 spring bouncy, settles by frame 45). Avatar at (W-180, H-180).
- All three elements overlap — star fires while text is settling, avatar enters while star is glowing.

**MetricsScene keyframes** (170 frames):
- Background: solid #0f172a (dark canvas), no video clip
- Frame 0–20: Scene title "The Numbers" fades in top-center, Inter 28px, muted color
- Frame 20–90: Counter 1 animates: `0 → 400` (spring slow). Label: "Threads resolved". Position: center-left (x: 480, y: 400). Font: Inter Bold 120px, amber.
- Frame 50–120: Counter 2 animates: `1x → 2x` (spring slow). Label: "PR throughput". Position: center-right (x: 1440, y: 400). Font: Inter Bold 120px, green.
- Frame 100–150: Tagline "Minutes, not days." fades in below counters (y: 700). Font: Playfair Display 48px, white.
- Frame 150–170: Subtle amber glow pulse on both counters

**BuildersScene keyframes** (59 frames):
- Background: solid #0f172a
- Frame 0–15: "Engineers" appears (blur 8px→0, opacity 0→1, spring snappy). Font: Playfair Display 72px, white. Position: center.
- Frame 12–30: "are" appears below (same blur entrance, stagger +12)
- Frame 24–45: "builders" appears below (same, stagger +12). Color: amber #d97706.
- Frame 40–59: "now." appears inline after "builders" (spring gentle, opacity 0→1). Full phrase visible: "Engineers are builders now."

**Category 4: Closing (1)** — `TaglineScene.tsx`

| Scene | Duration | Treatment |
|-------|----------|-----------|
| 21_tagline | 2.87s | Star logo scales in with glow rings → "TARA" text → "Build what matters." tagline |

### Transition System

Transitions are React components that overlay the last 12 frames of scene N and first 12 frames of scene N+1 (0.4s overlap at 30fps).

| Transition Into | Component | Effect |
|----------------|-----------|--------|
| bridge_weight_thesis | FadeBlackTransition | Intentional dark moment |
| 06c_thesis_closer | MorphTransition | Scale up + blur dissolve |
| 07_slack_thread | ThreadTransition | Amber thread draws right → Slack UI |
| bridge_demo_impact | FadeBlackTransition | Dark bridge |
| 15_metrics | MorphTransition | Energy burst upward |
| 18_builders | MorphTransition | Punch in |
| 21_tagline | ThreadTransition | Thread converges to center star |
| All others | ThreadTransition | Default amber thread (subtle) |

**ThreadTransition**: An SVG line (#d97706, 2px) draws across the screen using `strokeDasharray` + animated `strokeDashoffset`. Creates visual continuity — the thread "connects" scene to scene.

**MorphTransition**: Outgoing scene scales 1.0→1.1 + blur 0→8px while incoming scene scales 0.95→1.0 + opacity 0→1. Creates energy for climax moments.

**FadeBlackTransition**: Simple opacity fade through black. Used sparingly for intentional "breath" moments.

### Composition Structure

`Root.tsx` registers a single composition. `TaraVideo.tsx` uses `<Sequence>` for frame-accurate scene placement:

```typescript
// Root.tsx
import { Composition } from 'remotion';
import { TaraVideo } from './TaraVideo';

const FPS = 30;
const DURATION_FRAMES = 4385; // ceil(146.16 * 30)

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TaraVideoV2"
    component={TaraVideo}
    durationInFrames={DURATION_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
```

```typescript
// TaraVideo.tsx (scene sequencing pattern)
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from 'remotion';
import { SCENES } from './timing';

export const TaraVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Audio layers */}
      <Audio src={staticFile('voiceover/tara-v7-newvoice_v1.mp3')} />
      <Audio src={staticFile('music/tara_v74_music.wav')} volume={musicVolume} />

      {/* Scene sequences — each placed at exact frame offset */}
      {SCENES.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneRouter scene={scene} />
        </Sequence>
      ))}

      {/* Transition overlays — span last 12 frames of scene N + first 12 of N+1 */}
      {SCENES.slice(1).map((scene, i) => {
        const prev = SCENES[i];
        const overlapStart = prev.startFrame + prev.durationFrames - 12;
        return (
          <Sequence
            key={`transition-${scene.id}`}
            from={overlapStart}
            durationInFrames={24}
          >
            <TransitionRouter from={prev} to={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// SceneRouter — dispatches to the correct scene component based on category + id
const SceneRouter: React.FC<{ scene: SceneEntry }> = ({ scene }) => {
  switch (scene.category) {
    case 'abstract':
      return <AbstractScene clip={scene.asset} textOverlay={scene.textOverlay} />;
    case 'screenshot':
      return <ScreenshotScene sceneId={scene.id} screenshot={scene.asset} />;
    case 'special':
      // Special scenes have unique components — dispatch by ID
      if (scene.id === '06c_thesis_closer') return <ThesisScene />;
      if (scene.id === '15_metrics') return <MetricsScene />;
      if (scene.id === '18_builders') return <BuildersScene />;
      return <AbstractScene clip={scene.asset} />;
    case 'closing':
      return <TaglineScene />;
  }
};

// TransitionRouter — selects transition component based on scene.transition field
const TransitionRouter: React.FC<{ from: SceneEntry; to: SceneEntry }> = ({ from, to }) => {
  switch (to.transition) {
    case 'fadeBlack': return <FadeBlackTransition />;
    case 'morph':    return <MorphTransition />;
    case 'thread':
    default:         return <ThreadTransition />;
  }
};
```

```typescript
// timing.ts — scene boundary data (derived from voiceover_timing_map_v4.json)
const FPS = 30;

export interface SceneEntry {
  id: string;
  category: 'abstract' | 'screenshot' | 'special' | 'closing';
  startFrame: number;      // Math.round(narration_start * FPS)
  durationFrames: number;  // Math.round(duration * FPS)
  asset: string;           // clip filename or screenshot filename
  transition: 'thread' | 'fadeBlack' | 'morph';
  textOverlay?: string;    // optional text to overlay on abstract scenes
}

export const SCENES: SceneEntry[] = [
  { id: '01_opening', category: 'abstract', startFrame: 0, durationFrames: 263, asset: '01_opening_v2.mp4', transition: 'thread' },
  { id: '03_gap', category: 'abstract', startFrame: 263, durationFrames: 196, asset: '03_gap_v2.mp4', transition: 'thread' },
  // ... remaining 22 scenes follow same pattern
];
```

### Audio Architecture

Two `<Audio>` components in the main composition:

1. **Narration**: `tara-v7-newvoice_v1.mp3` at volume 1.0, starts at frame 0
2. **Music**: `tara_v74_music.wav` with per-scene volume automation:

```typescript
const musicVolume = (frame: number): number => {
  const t = frame / FPS;
  if (t < 2)    return interpolate(t, [0, 2], [0, 0.12]);  // fade in from silence
  if (t < 15)   return 0.12;    // subtle intro
  if (t < 34)   return 0.15;    // building
  if (t < 36)   return 0.08;    // bridge dip
  if (t < 55)   return 0.18;    // thesis build
  if (t < 58)   return 0.10;    // reveal breath
  if (t < 78)   return 0.15;    // demo steady
  if (t < 96)   return 0.12;    // collab, voice-forward
  if (t < 123)  return 0.18;    // execution energy
  if (t < 130)  return 0.08;    // bridge dip
  if (t < 136)  return 0.22;    // metrics climax
  if (t < 140)  return 0.20;    // builders punch
  return interpolate(t, [140, 146], [0.15, 0], { extrapolateRight: 'clamp' });
};
```

### Design System

**Colors:**
```typescript
const theme = {
  canvas:  { dark: '#0f172a', mid: '#1e293b', card: '#1a2332' },
  amber:   { primary: '#d97706', light: '#f59e0b', dim: '#92400e' },
  text:    { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  accent:  { green: '#4ade80', blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899' },
  slack:   { bg: '#1a1d21', message: '#222529', border: '#383a3e' },
};
```

**Spring presets:**
```typescript
const springs = {
  gentle:  { damping: 20, mass: 0.8, stiffness: 80 },
  snappy:  { damping: 15, mass: 0.5, stiffness: 200 },
  bouncy:  { damping: 12, mass: 0.6, stiffness: 150 },
  slow:    { damping: 30, mass: 1.0, stiffness: 50 },
};
```

**Fonts:**
```typescript
const fonts = {
  sans:  "'Inter', system-ui, sans-serif",
  mono:  "'SF Mono', 'Fira Code', monospace",
  serif: "'Playfair Display', Georgia, serif",
};
```

**Resolution:** 1920×1080, 30fps, 4385 frames (146.16s × 30 = 4384.8, ceil → 4385)

**Font loading:** Fonts are loaded via `@remotion/google-fonts` (Inter, Playfair Display) and local `@font-face` declarations in `Root.tsx` (SF Mono / Fira Code fallback). All font loading must complete before first render — use `continueRender` / `delayRender` pattern:

```typescript
// Root.tsx
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';

const { waitUntilDone } = loadInter();
const { waitUntilDone: waitPlayfair } = loadPlayfair();
// Call in useEffect with delayRender/continueRender
```

### Component Specifications

**TaraAvatar**: 160px circle, `border: 3px solid #d97706`. Entrance: bouncy spring scale 0→1. Idle: amber box-shadow pulse (2s cycle, 0.3→0.6 alpha). Position: bottom-right (W-180, H-180) on screenshots, center on thesis.

**AmberThread**: SVG `<line>` or `<path>` in #d97706, 2px stroke. Animated via `strokeDashoffset` over 12–20 frames. Creates visual continuity across all scenes.

**SlackMessage**: Card (rgba(34,37,41,0.85)), slides in from left (translateX -20→0, 15 frames). 32px avatar circle + name + timestamp. Message text reveals via clipPath or character-by-character opacity.

**TypingCursor**: `|` in #4ade80, 20px. Blinks: opacity 0.9/0 every 15 frames. Position animates along keyframe path per scene.

**TextOverlay**: Drop shadow (2px, black@0.6). Optional bg box (black@0.5, 12px pad). Spring entrance translateY 20→0. Configurable delay keyed to narration.

**StarMotif**: 5-pointed star SVG in #d97706. Bouncy spring scale 0→1. 3 concentric glow rings expand (staggered 8 frames). Used in thesis and tagline scenes.

## Render Pipeline

```jsonc
// package.json scripts
{
  "scripts": {
    "start": "remotion studio",
    "render:draft": "remotion render TaraVideoV2 out/tara_v2_draft.mp4 --image-format=jpeg --jpeg-quality=60 --concurrency=4",
    "render": "remotion render TaraVideoV2 out/tara_v2.mp4 --codec=h264 --crf=18 --image-format=jpeg --jpeg-quality=100",
    "render:720p": "remotion render TaraVideoV2 out/tara_v2_720p.mp4 --codec=h264 --crf=18 --scale=0.667"
  }
}
```

## Success Criteria

The video should score **7.0+** on the Gemini analysis rubric, specifically:
- **Transitions flow: 6+** (currently 5) — achieved via unified thread motif + custom transitions
- **Visual quality: 7+** (maintaining) — real screenshots with legible text + motion overlays
- **Character brand: 7+** (from 4-8 range) — consistent avatar with spring animations
- **Pacing energy: 7+** (from 6-7 range) — no freeze frames, continuous motion
- **Professional polish: 7+** (from 6) — unified design system, spring physics, no jarring cuts

## Assets (All Existing — No New Generation Needed)

- **8 product screenshots** in `assets/screenshots/`: race-condition-confirmed.png, tara-slack-search.png, bug-fix-tara-response.png, async-loop-yaswanth-review.png, tara-jira-pdf-report.png, coding-agent-implementing.png, coding-agent-progress.png, vinay-backend-configs.png
- **15 Veo 2 / AI clips used** from `v7/output/veo3/` (73 clips exist, 15 referenced by scenes): 01_opening_v2, 03_gap_v2, 05_weight_v2, bridge_weight_to_thesis_v2, 06_thesis_v2, 06b_friction_v2, bridge_thesis_to_slack_v2, 06c_tara_reveal_v2, 11_plan_forms_v3, 14_tara_connects_v2, bridge_demo_to_impact_v2, 15_metrics_v2, 17_future_v2, 18_builders_v2, 19_constellation_v2
- **Voiceover:** `v7/assets/voiceover/v7/tara-v7-newvoice_v1.mp3`
- **Music:** `v7/assets/music/tara_v74_music.wav`
- **Avatar:** `assets/avatar/tara_square_nobg.png`
- **Timing map:** `v7/output/voiceover_timing_map_v4.json`

All paths relative to `docs/plans/video-production/`.

### Asset Validation

At composition load time, validate all required assets exist. If a clip or screenshot is missing, render a magenta placeholder frame with the missing filename — this prevents silent render failures:

```typescript
// In ScreenshotScene / AbstractScene:
const [loaded, setLoaded] = useState(true);
// <Img onError={() => setLoaded(false)} />
// If !loaded → render <AbsoluteFill style={{bg: 'magenta'}}><p>MISSING: {asset}</p></AbsoluteFill>
```

### Video Clip Duration Handling

Veo 2 clips are ~8s but some scenes are longer (up to 12.42s). `<OffthreadVideo>` shows black after the clip ends. Strategy: use `endAt` to freeze on the last frame when scene duration exceeds clip duration. For clips significantly shorter than their scene (>2s gap), use `playbackRate={clipDuration / sceneDuration}` to slow the clip to fill. This is preferred over looping, which creates visible jumps.

### Music Volume Envelope

The music fades in from silence over the first 2 seconds (60 frames) to prevent an abrupt start. The fade-out at the end is already defined in the volume function (interpolates to 0 over final 6 seconds). Full volume envelope is in the `musicVolume` function under Audio Architecture.

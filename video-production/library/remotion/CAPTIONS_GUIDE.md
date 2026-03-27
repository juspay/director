# Remotion Animated Captions Guide

Migrate from FFmpeg SRT burn-in to Remotion-native animated captions using `@remotion/captions`.

## Why Migrate?

| Feature | FFmpeg burn-in | Remotion captions |
|---------|---------------|-------------------|
| Word-by-word animation | Not possible | Full control per word |
| Spring physics | No | Yes (Remotion `spring()`) |
| Per-word color/glow | No | Full CSS per word per frame |
| Style changes without re-encode | No | Yes (just re-render) |
| Performance | Fast (single FFmpeg pass) | Slower (Remotion render) |

## Installation

```bash
npx remotion add @remotion/captions
```

## Step 1: Parse SRT from caption_burner.py output

```typescript
import { parseSrt } from '@remotion/captions';

const srtContent = await fetch('/captions.srt').then(r => r.text());
const { captions } = parseSrt({ input: srtContent });
```

## Step 2: Create TikTok-style word pages

```typescript
import { createTikTokStyleCaptions } from '@remotion/captions';

const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 500, // Group words within 500ms
});
```

Each page contains:
- `text`: full display text
- `startMs` / `durationMs`: page timing
- `tokens[]`: array of `{ text, fromMs, toMs }` per word

## Step 3: Animated word highlighting component

```typescript
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface CaptionPageProps {
  page: { text: string; startMs: number; tokens: Array<{ text: string; fromMs: number; toMs: number }> };
}

export const AnimatedCaption: React.FC<CaptionPageProps> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 32,
      fontWeight: 700,
    }}>
      {page.tokens.map((token, i) => {
        const isActive = timeMs >= token.fromMs && timeMs < token.toMs;
        const isPast = timeMs >= token.toMs;
        const wordStartFrame = Math.round((token.fromMs / 1000) * fps);

        // Spring bounce on word activation
        const bounce = isActive ? spring({
          frame: frame - wordStartFrame,
          fps,
          config: { damping: 10, mass: 0.5, stiffness: 200 },
        }) : 1;

        const scale = isActive ? interpolate(bounce, [0, 1], [0.8, 1.1]) : 1;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `scale(${scale})`,
              color: isActive ? '#d97706' : isPast ? '#ffffff' : '#ffffff80',
              textShadow: isActive ? '0 0 20px rgba(217, 119, 6, 0.5)' : 'none',
              transition: 'color 0.1s',
              marginRight: 6,
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
```

## Step 4: Integrate into composition

```typescript
import { Sequence } from 'remotion';
import { AnimatedCaption } from './AnimatedCaption';

// In your main composition:
{pages.map((page, i) => {
  const startFrame = Math.round((page.startMs / 1000) * fps);
  const durationFrames = Math.round((page.durationMs / 1000) * fps);

  return (
    <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
      <AnimatedCaption page={page} />
    </Sequence>
  );
})}
```

## Migration from caption_burner.py

1. **Keep** `generate_srt()` in caption_burner.py — it produces the SRT that Remotion parses
2. **Keep** `validate_wer()` and `validate_srt()` — quality gates still apply
3. **Remove** or make optional the `burn_captions()` FFmpeg step
4. **Add** the Remotion caption components to your composition
5. The SRT file becomes an intermediate artifact, not the final burn-in source

## Reference Template

The official TikTok template demonstrates the full workflow:
https://github.com/remotion-dev/template-tiktok

## Tips

- Use `combineTokensWithinMilliseconds: 300-500` for word-by-word highlighting
- For karaoke-style (one word at a time), use `100`
- Increase `fontSize` to 44-48 for 9:16 vertical (Shorts/TikTok)
- The amber highlight color `#d97706` matches the pipeline's design system

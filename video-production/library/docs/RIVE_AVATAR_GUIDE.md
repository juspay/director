# Rive Avatar Migration Guide

Migrate Tara's avatar from D-ID API to Rive animation for zero-cost, deterministic, transparent-background character rendering.

## Why Rive?

| Feature | D-ID | MuseTalk | Rive |
|---------|------|----------|------|
| Cost per render | ~$0.50/min | ~$0.01-0.05/clip | **$0 (free)** |
| Latency | 30-90s API call | 10-30s | **Instant (local)** |
| Transparency | Green screen → colorkey | No alpha | **Native alpha** |
| Consistency | Slight variation per render | Slight variation | **Pixel-perfect identical** |
| Uncanny valley | Risk (photorealistic) | Risk (photorealistic) | **None (stylized)** |
| Offline capability | No (needs API) | GPU needed | **Yes (CPU/GPU)** |
| Remotion integration | FFmpeg compositing | FFmpeg compositing | **@remotion/rive native** |

## Character Design Requirements

### Tara's Identity (from existing design spec)
- Pixar-style, dark blue bob haircut
- Large blue eyes with subtle expression capability
- Royal blue t-shirt with neural network logo
- Warm skin tone
- Friendly, approachable character design

### Rive Character Rig

The Rive character needs:

1. **Skeletal rig**: Head, neck, torso, both arms, both hands
2. **Facial bones**: Eyebrows (2), eyes (2), mouth, jaw
3. **Viseme set** (mouth shapes for lip sync):
   - `sil` — mouth closed (silence)
   - `PP` — bilabial (p, b, m)
   - `FF` — labiodental (f, v)
   - `TH` — dental (th)
   - `DD` — alveolar (t, d, n, l)
   - `kk` — velar (k, g)
   - `CH` — post-alveolar (ch, j, sh)
   - `SS` — sibilant (s, z)
   - `nn` — nasal (n, m, ng)
   - `RR` — rhotic (r)
   - `aa` — open vowel (a, ah)
   - `E` — front vowel (e, eh)
   - `ih` — close front (i, ee)
   - `oh` — rounded (o, oo)
   - `ou` — close back (u, uw)

4. **State machine states**:
   - `idle` — subtle breathing animation, slight head movement
   - `speaking` — lip sync driven by viseme timestamps
   - `thinking` — head tilt, eyes up-left, subtle nod
   - `happy` — smile, slight bounce
   - `listening` — attentive pose, occasional nod
   - `working` — focused expression, typing gesture

### Design Tool

Create in [Rive Editor](https://rive.app/editor) (free for personal use):
- Use bones for skeletal animation
- Create state machine with inputs for each state
- Export as `.riv` file

**Estimated effort**: 2-3 days for character design, 1 day for rigging + state machine.

## Viseme-Driven Lip Sync

### ElevenLabs Viseme Timestamps

ElevenLabs v3 can return viseme timestamps alongside audio generation.
The API response includes a `alignment` object with per-phoneme timing:

```json
{
  "audio": "base64...",
  "alignment": {
    "characters": ["T", "h", "i", "r", ...],
    "character_start_times_seconds": [0.0, 0.05, 0.08, ...],
    "character_end_times_seconds": [0.05, 0.08, 0.12, ...]
  }
}
```

Map phonemes to visemes using a lookup table, then drive Rive state machine inputs.

### Phoneme-to-Viseme Mapping

```typescript
const PHONEME_TO_VISEME: Record<string, string> = {
  // Bilabial
  'p': 'PP', 'b': 'PP', 'm': 'PP',
  // Labiodental
  'f': 'FF', 'v': 'FF',
  // Dental
  'θ': 'TH', 'ð': 'TH',
  // Alveolar
  't': 'DD', 'd': 'DD', 'n': 'DD', 'l': 'DD',
  // Velar
  'k': 'kk', 'g': 'kk',
  // Post-alveolar
  'ʃ': 'CH', 'ʒ': 'CH', 'tʃ': 'CH', 'dʒ': 'CH',
  // Sibilant
  's': 'SS', 'z': 'SS',
  // Vowels
  'æ': 'aa', 'ɑ': 'aa', 'ʌ': 'aa',
  'ɛ': 'E', 'e': 'E',
  'ɪ': 'ih', 'i': 'ih',
  'ɔ': 'oh', 'o': 'oh',
  'ʊ': 'ou', 'u': 'ou',
};
```

## @remotion/rive Integration

### Installation

```bash
npm install @remotion/rive @rive-app/react-webgl2
```

### Component

```typescript
import { RiveCanvas } from '@remotion/rive';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const TaraAvatar: React.FC<{
  visemeTimeline: Array<{ time: number; viseme: string }>;
  state: 'idle' | 'speaking' | 'thinking' | 'happy';
}> = ({ visemeTimeline, state }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current viseme
  const currentViseme = visemeTimeline.reduce((acc, v) => {
    return v.time <= currentTime ? v : acc;
  }, { time: 0, viseme: 'sil' });

  return (
    <RiveCanvas
      src={staticFile('tara.riv')}
      artboard="Tara"
      stateMachines="MainStateMachine"
      onLoad={(rive) => {
        // Set state machine inputs
        const inputs = rive.stateMachineInputs('MainStateMachine');
        const stateInput = inputs.find(i => i.name === 'state');
        const visemeInput = inputs.find(i => i.name === 'viseme');

        if (stateInput) stateInput.value = state;
        if (visemeInput) visemeInput.value = currentViseme.viseme;
      }}
      style={{ width: 400, height: 600 }}
    />
  );
};
```

## Cost Comparison

For a 2:50 video with 2 avatar scenes (act4 + act8):

| Approach | Cost per render | 10 iterations | Annual (weekly renders) |
|----------|----------------|---------------|------------------------|
| D-ID API | ~$2.00 | $20.00 | ~$100 |
| MuseTalk (Replicate) | ~$0.10 | $1.00 | ~$5 |
| **Rive** | **$0.00** | **$0.00** | **$0.00** |

Plus: Rive eliminates green screen artifacts, API latency, and uncanny valley concerns.

## Migration Steps

1. **Commission Rive character** — Use Rive Editor to create Tara with skeletal rig, viseme set, and state machine (2-3 days)
2. **Export .riv file** — Place in Remotion's `public/` directory
3. **Build TaraAvatar component** — `@remotion/rive` with viseme timeline input
4. **Extract viseme timestamps** — Add ElevenLabs alignment parsing to voiceover pipeline
5. **Replace D-ID scenes** — Swap `create_avatar_composite()` calls with `<TaraAvatar>` component
6. **Remove green screen pipeline** — `green_screen.py` becomes unnecessary
7. **Test** — Verify lip sync quality, expression transitions, rendering performance

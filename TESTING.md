# Director Testing Playbook

A staged plan for proving every part of the pipeline works. Tiers are
ordered by dependency — work top-down. The earliest tiers cost nothing
and run on a developer laptop; later tiers require provider keys and
spend real money.

---

## What's already proven (CI-enforced)

| Layer | Status | Where |
|-------|--------|-------|
| TypeScript typecheck | 0 errors | `npm run typecheck` |
| Module imports (10 barrels) | all load | dry-run boot |
| Unit + integration tests | 53 pass | `npm test` |
| Pipeline dry-run (7/7 phases) | pass | `npm start -- --dry-run` |
| npm audit | 0 vulnerabilities | `npm audit` |

CI runs the whole stack on Node 20/22/24 plus a dedicated Python job
on every push. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Prerequisites

```bash
# System tools (one-time)
brew install ffmpeg python@3.11 jq
node --version    # >= 20
python3 --version # >= 3.11

# Python DSP deps (Tier 0+)
pip install -r scripts/python/requirements.txt

# Optional — for Veo (Tier 1)
gcloud auth application-default login
```

Copy and populate `.env`:

```bash
cp .env.example .env
# fill in keys as you reach each tier
```

---

## Tier 0 — no-key smoke (run first)

Doesn't need any provider keys. If this fails, nothing else will work.

```bash
npm run test:tier-0
```

Runs 6 checks against a temporary `out/tier0/` directory:

| # | Check | Proves |
|---|-------|--------|
| 0.0 | Prerequisites | node, python3, ffmpeg, edge-tts, numpy/scipy/librosa/pretty_midi all installed |
| 0.1 | Edge-TTS voiceover | Microsoft TTS plumbing works without keys |
| 0.2 | `synthesize-music.py` | NumPy/SciPy multi-instrument synthesis end-to-end |
| 0.3 | `synthesize-sfx.py` | Karplus-Strong + sub_pulse + shimmer SFX generation |
| 0.4 | `analyze-audio.py` | librosa spectral feature extraction + composite scoring |
| 0.5 | `mix-audio.py` | VAD-aware ducking + LUFS normalization (graceful degradation if torch/pedalboard missing) |

Pass: every step prints `PASS`, exit code 0.
Cost: $0. Time: ~2 min on a M-series Mac.

See [TIER0-RESULTS.md](TIER0-RESULTS.md) for an actual capture.

---

## Tier 1 — single-provider smoke

For each provider, the smallest possible test that proves the
integration works. Do these one at a time so failures are isolated.

### Where to grab keys

| Provider | Dashboard | Env var | Free tier? |
|----------|-----------|---------|-----------|
| **Gemini** (Lyria + agents) | https://aistudio.google.com/apikey | `GEMINI_API_KEY` | Yes |
| **ElevenLabs** | https://elevenlabs.io/app/settings/api-keys | `ELEVENLABS_API_KEY` | Yes (10k chars/mo) |
| **OpenAI** | https://platform.openai.com/api-keys | `OPENAI_API_KEY` | No (~$0.015/min TTS) |
| **Fish Audio** | https://fish.audio/go-api/ | `FISH_AUDIO_API_KEY` | Trial |
| **Kling** | https://app.klingai.com/global/dev/document-api/quickStart | `KLING_API_KEY` | Trial credits |
| **Runway** | https://app.runwayml.com/account?tab=api | `RUNWAY_API_KEY` | $0.05 / s of video |
| **D-ID** | https://studio.d-id.com/account-settings/api-keys | `DID_API_KEY` | Trial |
| **Replicate** (MuseTalk + Wan) | https://replicate.com/account/api-tokens | `REPLICATE_API_TOKEN` | Pay-as-you-go |
| **Beatoven** | https://www.beatoven.ai/track-api | `BEATOVEN_API_KEY` | Trial |
| **Mux** | https://dashboard.mux.com/settings/access-tokens | `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` | $0.0005 / min stored |
| **Late** | https://getlate.dev/dashboard/api-keys | `LATE_API_KEY` | Trial |

### 1.1 Gemini agents (cheapest — start here)

```bash
node --import tsx src/agents/scene-analyzer.ts
node --import tsx src/agents/creative-director.ts
```

Pass: prints scored JSON, no API errors. Cost: ~$0.001 per run on `gemini-2.5-flash`.

### 1.2 TTS providers

```bash
# ElevenLabs
node --import tsx -e "
import { synthesize } from './src/voiceover/elevenlabs.ts';
await synthesize('ElevenLabs test.', 'out/test-eleven.mp3');
"

# OpenAI
node --import tsx -e "
import { synthesize } from './src/voiceover/openai-tts.ts';
await synthesize('OpenAI test.', 'out/test-openai.mp3');
"

# Fish Audio
node --import tsx -e "
import { synthesize } from './src/voiceover/fish-audio.ts';
await synthesize('Fish Audio test.', 'out/test-fish.mp3');
"
```

Pass: each .mp3 plays back the correct phrase. Cost: < $0.10 total.

### 1.3 Video generators — short clip each

```bash
# Kling — 5 s clip
node --import tsx -e "
import { generateClip } from './src/generators/kling.ts';
await generateClip('a dog running on a beach, cinematic, 1080p', 'out/test-kling.mp4', { duration: 5 });
"

# Runway — 5 s clip
node --import tsx -e "
import { generateClip } from './src/generators/runway.ts';
await generateClip('a dog running on a beach', 'out/test-runway.mp4', { duration: 5, ratio: '1280:720' });
"

# Veo (needs gcloud auth + GOOGLE_CLOUD_PROJECT)
node --import tsx -e "
import { generateClip } from './src/generators/veo.ts';
await generateClip('a dog running on a beach', 'out/test-veo.mp4');
"

# Wan-Alpha via Replicate — RGBA test
node --import tsx -e "
import { generateRgbaVideo } from './src/generators/wan-alpha.ts';
await generateRgbaVideo('a transparent ghost waving', 'out/test-wan.webm');
"
```

Pass: each video file > 1 MB, opens in QuickTime, prompt is recognizable.
Cost: ~$0.50–2.00 per clip per provider.

### 1.4 Avatar lip sync

Uses fixtures from [`tests/fixtures/`](tests/fixtures/):

```bash
# D-ID
node --import tsx -e "
import { generateAvatar } from './src/avatar/did.ts';
await generateAvatar({
  sourceImage: 'tests/fixtures/portrait.jpg',
  audioFile: 'out/tier0/voiceover.mp3',
  outputPath: 'out/test-did.mp4',
});
"

# MuseTalk via Replicate
node --import tsx -e "
import { generateLipsync } from './src/avatar/musetalk.ts';
await generateLipsync({
  sourceVideo: 'tests/fixtures/portrait.mp4',
  audioFile: 'out/tier0/voiceover.mp3',
  outputPath: 'out/test-musetalk.mp4',
});
"
```

The placeholder fixtures are solid colors — swap in real face images
when validating output quality.

### 1.5 Music generators

```bash
# Lyria (Gemini)
node --import tsx -e "
import { generateTrack } from './src/music/lyria.ts';
await generateTrack({ prompt: 'cinematic build', duration: 30, outputPath: 'out/test-lyria.wav' });
"

# Beatoven
node --import tsx -e "
import { generateTrack } from './src/music/beatoven.ts';
await generateTrack({ prompt: 'cinematic build', duration: 30, outputPath: 'out/test-beatoven.mp3' });
"

# ElevenLabs Music
node --import tsx -e "
import { generateTrack } from './src/music/elevenlabs-music.ts';
await generateTrack({ prompt: 'cinematic build', duration: 30, outputPath: 'out/test-elmusic.mp3' });
"
```

### 1.6 Distribution

```bash
# Mux upload
node --import tsx -e "
import { uploadToMux } from './src/distribution/mux-hosting.ts';
const { playbackId } = await uploadToMux('out/tier0/mixed.wav');
console.log('https://stream.mux.com/' + playbackId + '.m3u8');
"

# Late — DRY RUN ONLY first to avoid posting
LATE_DRY_RUN=1 node --import tsx -e "
import { publishToPlatforms } from './src/distribution/late-publisher.ts';
await publishToPlatforms({ video: 'out/tier0/voiceover.mp3', caption: 'test', platforms: ['twitter'] });
"
```

---

## Tier 2 — per-phase pipeline tests

Run each pipeline phase in isolation against a real script.

```bash
SCRIPT=tests/fixtures/script.md

# Phase 1 only — voiceover
node --import tsx src/pipeline/runner.ts --phases 1 --script $SCRIPT --provider edgetts

# Phase 1+3 — voiceover + b-roll
node --import tsx src/pipeline/runner.ts --phases 1,3 --script $SCRIPT --provider edgetts --video-gen kling

# Phase 4 only — music
node --import tsx src/pipeline/runner.ts --phases 4 --script $SCRIPT --music-gen lyria

# Phase 5+6+7 — render + assembly + captions
node --import tsx src/pipeline/runner.ts --phases 5,6,7 --script $SCRIPT
```

Pass: each phase produces its expected artifact in `output/` and
`.pipeline-state/pipeline-state.json` shows the phase as complete.

---

## Tier 3 — full pipeline runs

Pick the cheapest provider combo first.

```bash
SCRIPT=tests/fixtures/script.md

# Cheapest combo (Edge-TTS free + Lyria free tier)
node --import tsx src/pipeline/runner.ts \
  --script $SCRIPT \
  --provider edgetts \
  --video-gen kling \
  --music-gen lyria \
  --skip-scoring

# Quality combo (production-ready)
node --import tsx src/pipeline/runner.ts \
  --script $SCRIPT \
  --provider elevenlabs \
  --video-gen veo \
  --music-gen lyria

# With avatar
node --import tsx src/pipeline/runner.ts \
  --script $SCRIPT \
  --provider elevenlabs \
  --video-gen kling \
  --avatar-source tests/fixtures/portrait.jpg \
  --avatar-provider did
```

Pass:
- `output/final.mp4` exists
- Plays end-to-end with voiceover + visuals + music + captions
- `.pipeline-state/observability-report.json` shows all 7 phases
  completed, 0 critical violations
- Post-pipeline scoring (when not skipped) gives `weighted_overall` ≥ 7.0

Estimated cost per run: $5–15 depending on provider mix.

---

## Tier 4 — quality and observability

After a full run:

```bash
# Inspect observability report
cat .pipeline-state/observability-report.json | jq '{
  totalCost, totalTokens, completedAgents,
  policyViolations: (.policyViolations | length)
}'

# Per-agent metrics
cat .pipeline-state/agent-metrics.jsonl |
  jq -s 'group_by(.agentName) | map({
    agent: .[0].agentName,
    count: length,
    avgMs: (map(.executionTimeMs) | add / length)
  })'

# Score the output
node --import tsx src/agents/video-scorer.ts -- output/final.mp4

# Compare two runs
node --import tsx src/agents/video-comparator.ts -- output/run1.mp4 output/run2.mp4

# Generate dashboard
npm run dashboard
```

Pass: all reports parse, scoring returns valid JSON, dashboard HTML renders.

---

## Tier 5 — failure modes

Make sure the pipeline doesn't silently corrupt state when things go wrong.

```bash
# 1. Bad API key — should fail fast with a clear error
ELEVENLABS_API_KEY=invalid \
  node --import tsx src/pipeline/runner.ts --phases 1 \
  --script tests/fixtures/script.md --provider elevenlabs

# 2. Resume after kill
node --import tsx src/pipeline/runner.ts \
  --script tests/fixtures/script.md &
PID=$!
sleep 30 && kill $PID
node --import tsx src/pipeline/runner.ts \
  --script tests/fixtures/script.md   # should pick up where it left off

# 3. Rate-limit handling — flood the same provider
for i in {1..10}; do
  node --import tsx -e "
    import {synthesize} from './src/voiceover/elevenlabs.ts';
    await synthesize('test $i', 'out/rate-$i.mp3');
  " &
done; wait

# 4. Missing input file
node --import tsx src/pipeline/runner.ts --script does-not-exist.md
```

Pass: clear error messages, state file reflects what completed, no
half-written outputs.

---

## Recommended sequence

1. **Now (no keys)** — Tier 0
2. **Get Gemini key first** (free) — Tier 1.1 + Tier 1.5 Lyria
3. **Get ElevenLabs key** (free tier) — Tier 1.2
4. **Pick ONE video provider** to start (Kling has trial credits) — Tier 1.3
5. **Tier 2** — phase-by-phase
6. **Tier 3** — first full run with cheapest combo
7. **Tier 4** — observability
8. **Tier 5** — failure modes
9. Add other providers incrementally

Total time: ~6–8 hours of active testing + waits.
Total cost: $20–40 for thorough cross-provider validation.

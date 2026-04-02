# Director Pipeline Improvement Plan

**Created:** 2026-03-26
**Based on:** 12 parallel research agents covering TTS, music, video generation, Remotion, QA/scoring, avatars, SFX/audio, captions, orchestration, post-production, scripting, and distribution.

---

## Quick Wins (1-line to 1-day changes)

| # | Change | File to Modify | Effort | Impact |
|---|--------|---------------|--------|--------|
| 1 | Add `-tune animation` to H.264 encoding | `library/rendering/assembler.py` | 1 line | 10-20% smaller files for motion graphics |
| 2 | Upgrade Whisper to `large-v3-turbo` | `library/rendering/caption_burner.py` | 1 line (`model_size="large-v3-turbo"`) | 4x faster transcription, slightly better accuracy |
| 3 | Set Gemini temperature to 0.0 | `library/scoring/gemini_video_scorer.py` | 1 line | Reduces scoring variance |
| 4 | Randomize rubric dimension order per run | `library/scoring/gemini_video_scorer.py` | ~10 lines | Reduces positional bias in scoring |
| 5 | Increase caption FontSize from 22 to 32 | `library/rendering/caption_burner.py` | 1 line | Better readability on mobile |
| 6 | Add `pyloudnorm` for LUFS measurement | `library/mixing/vad_mixer.py` | `pip install pyloudnorm` + ~20 lines | Loudness standardization (-14 LUFS target) |
| 7 | Replace RMS VAD with Silero VAD | `library/mixing/vad_mixer.py` | `pip install silero-vad` + refactor | Dramatically better voice detection for ducking |
| 8 | Upgrade ElevenLabs from SSML to audio tags | `library/voiceover/elevenlabs_generator.py` | Rewrite SSML to `[pause]`, `[excited]`, etc. | v3 doesn't support SSML; audio tags are the correct API |
| 9 | Add AV1 output profile | `library/pipeline/pipeline_config.py` | New preset definition | 45-50% smaller web files |
| 10 | Add VideoToolbox fast path for drafts | `library/pipeline/pipeline_config.py` | New preset + `h264_videotoolbox` | 4x faster draft renders on macOS |

---

## Medium-Term Upgrades (1-5 day integration)

### Voiceover

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 11 | Add **OpenAI gpt-4o-mini-tts** provider | Prompt-steerable delivery ("speak with quiet contemplation, building to confident energy") — most natural fit for narration arcs | ~$15/1M chars |
| 12 | Add **Fish Audio S2 Pro** provider | 80% cheaper than ElevenLabs, comparable quality, 15-second voice cloning | ~$15/1M chars |
| 13 | Replace genetic optimizer with **Optuna Bayesian optimization** | Converges in 10-15 trials vs 50 — saves ~70% API cost per optimization run | Free (pip install optuna) |
| 14 | Add **UTMOSv2** to acoustic scorer | Predicts human MOS directly from audio — the metric your 8 criteria approximate | Free (pip install) |
| 15 | Evaluate **Qwen3-TTS** for self-hosted generation | Apache 2.0, 3-second voice cloning, beats commercial APIs in benchmarks | Free (GPU required) |

### Music & Audio

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 16 | Add **Spotify Pedalboard** for effects | Replace hand-rolled reverb/compressor/limiter with studio-quality C++ effects, 300x faster | Free (pip install pedalboard) |
| 17 | Try **Google Lyria RealTime** | Free WebSocket-based music steering — change key/tempo/mood in real-time, maps to your BPM_MAP architecture | Free (Gemini API) |
| 18 | Try **Beatoven.ai** video-to-music API | Upload video, get soundtrack matched to visual pacing with scene markers | $100-200/yr |
| 19 | Add **ElevenLabs SFX v2** API for hero moments | Professional-quality text-to-SFX for transitions, reveals, stingers | Credits-based |
| 20 | Implement **frequency-aware ducking** | Duck only 200-4000 Hz (voice range), preserve bass and highs during narration | Free (Pedalboard filters) |

### Video Scoring & QA

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 21 | Enable **Gemini context caching** for runs 2-3 | 90% token savings on repeated video input across 3-run averaging | Minimal code change |
| 22 | Use **Flash for dev, Pro for official** scoring | Flash is 4x cheaper ($0.30 vs $1.25/1M input tokens) | Saves ~75% during development |
| 23 | Add **VMAF regression gating** | Deterministic quality comparison between iterations — no AI variance | Free (pip install ffmpeg-quality-metrics) |
| 24 | Add **VBench** temporal_flickering + motion_smoothness | 16-dimension automated video QA, catches flicker/jank Gemini misses | Free (pip install vbench) |
| 25 | Add `media_resolution="low"` option | 67% fewer video tokens with minimal impact on rubric-level assessment | Free config change |

### Remotion & Motion Graphics

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 26 | Upgrade to **Remotion 4.0.438** | Arrow shape, Mediabunny encoder, web-renderer improvements | Free |
| 27 | Adopt **@remotion/transitions** | Official fade/slide/wipe/clockWipe/iris — complement custom morphs | Free |
| 28 | Move captions to **@remotion/captions** | `createTikTokStyleCaptions()` for animated word-by-word highlighting with spring physics | Free |
| 29 | Evaluate **Remotion-UI** | "shadcn for motion" — TitleCard, LowerThird, StatBlock, ThemeProvider, design tokens | Free (MIT) |
| 30 | Explore **@remotion/rive** for new assets | Faster, smaller than Lottie, supports state machines | Free |

### Captioning

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 31 | Switch to **WhisperX** for word timestamps | wav2vec2 forced alignment gives ~20-30ms precision vs ~50-100ms from faster-whisper | Free (pip install whisperx) |
| 32 | Add **WER validation** against source scripts | You have the source text — compute exact word error rate for every caption run | Free |
| 33 | Add **pysubs2** for SRT validation | Check timing overlaps, line length, display duration, word count per entry | Free (pip install pysubs2) |

---

## Strategic Upgrades (1-2 week projects)

### Avatar System

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 34 | **Migrate Tara to Rive animation** | Eliminates D-ID costs, green screen artifacts, API latency, and uncanny valley. Native transparency, deterministic output, zero per-render cost. Drive mouth shapes from ElevenLabs viseme timestamps, render via @remotion/rive. | ~3 days character design + 1 day integration |
| 35 | Evaluate **MuseTalk** (open source lip sync) on Replicate | 30fps+ real-time, ~$0.01-0.05/clip vs D-ID's higher cost | ~$0.01-0.05/clip |

### Video Generation

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 36 | Add **Kling 3.0** as B-roll alternative | 4K/60fps, multi-shot character lock across 6 cuts, $0.029/sec vs our $0.12/sec Runway | 75% cost reduction |
| 37 | Evaluate **Wan-Alpha** for avatar compositing | Open source RGBA video generation — native transparency, no green screen pipeline needed | Free (CVPR 2026) |
| 38 | Add **Veo 3.1** via Gemini API | #2 ranked model, native 4K + synchronized audio, accessible through our existing Gemini setup | Usage-based |

### Pipeline Orchestration

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 39 | Adopt **Temporal** for durable execution | Crash-safe workflows, automatic retries with state persistence, saga compensation for failed phases, heartbeating for long Runway/HeyGen polls | Free (self-hosted) |
| 40 | Adopt **Dagster** for incremental builds | Model each scene's assets as software-defined assets with dependencies — only re-render what changed | Free (open source) |
| 41 | Move to **Remotion Lambda** for cloud rendering | Distributed rendering across Lambda functions — 170s video renders in <60s | AWS Lambda costs + Remotion license |
| 42 | Add **lakeFS** for asset versioning | Git-like branching for large media files in S3 — version control without Git LFS limitations | Free (self-hosted) |

### Distribution

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 43 | Integrate **Late API** for multi-platform posting | Single API posts video to YouTube, LinkedIn, TikTok, X, Instagram (13 platforms) | $19/mo |
| 44 | Add **Mux** for video hosting + analytics | Auto HLS transcoding, engagement analytics, QoE metrics | Free tier (100K min/mo) |
| 45 | Add **VideoObject JSON-LD** schema | 30% higher CTR in search results, video carousel eligibility | Free |
| 46 | Add platform-specific export presets | YouTube (1080p CRF 18), TikTok (1080x1920), Product Hunt (1080x1080 <30MB <60s) | Free config changes |

### Creative Direction

| # | Upgrade | Why | Cost |
|---|---------|-----|------|
| 47 | Add **Boords** for visual storyboard preview | Character-consistent storyboard frames alongside script text, animatic export | $25-99/mo |
| 48 | Add sub-3-second **silent visual hook** | 60%+ mobile viewers watch muted; 63% of highest-CTR videos hook in 3 seconds | Design change |

---

## Cost Tracking & Monitoring

| # | Tool | Purpose | Cost |
|---|------|---------|------|
| 49 | **LiteLLM** proxy | Automatic cost tracking for all LLM calls (Gemini scoring) | Free (self-hosted) |
| 50 | **Helicone** | Open-source LLM observability, 300+ model pricing database | Free tier (10K req/mo) |
| 51 | Custom `CostTracker` class | Track non-LLM API costs (ElevenLabs, Runway, D-ID) to JSON-lines | Build it |

---

## Architecture Vision: AI Director Pipeline

The research converges on a **Planner/Generator/Evaluator agent architecture** (Anthropic's recommended pattern):

```
┌─────────────────────────────────────────────────────────────┐
│                    PLANNER AGENT (Claude)                    │
│  - Interprets creative brief                                │
│  - Generates optimized prompts per phase                    │
│  - Selects between providers (ElevenLabs vs Fish vs OpenAI) │
│  - Designs BPM map, volume curves, SFX placement            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               GENERATOR (Temporal/Dagster Pipeline)          │
│                                                              │
│  Phase 1: Voiceover ──► [Optuna optimizer across providers]  │
│                    │                                         │
│  Phase 2: Avatar ──┤── (Rive animation, no API needed)       │
│  Phase 3: B-roll ──┤── (Kling 3.0 / Runway / Veo 3.1)       │
│  Phase 4: Music  ──┘── (NumPy synth / Lyria RealTime)        │
│                    │                                         │
│  Phase 5: Remotion render (Lambda, @remotion/captions)       │
│  Phase 6: Assembly (FFmpeg, AV1, -tune animation)            │
│  Phase 7: Captions (WhisperX + Remotion animated)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   EVALUATOR (Multi-Signal)                    │
│                                                              │
│  Deterministic:  VMAF, VBench, LUFS, UTMOSv2, WER           │
│  AI-scored:      Gemini Flash (dev) / Pro (official)         │
│  Regression:     VMAF delta gating, per-dimension trending   │
│                                                              │
│  Decision: iterate (send feedback to Planner) or ship        │
└─────────────────────────────────────────────────────────────┘
```

---

## Priority Matrix

### Highest Impact / Lowest Effort (Do First)
- #1 `-tune animation` (1 line)
- #2 Whisper v3-turbo (1 line)
- #6 pyloudnorm (20 lines)
- #7 Silero VAD (refactor)
- #16 Spotify Pedalboard (replace compressor/reverb)
- #21 Gemini context caching (small code change)
- #23 VMAF regression gating (pip install + 30 lines)

### Highest Impact / Medium Effort (Do Next)
- #13 Optuna Bayesian optimization
- #28 @remotion/captions for animated captions
- #34 Rive animation for Tara avatar
- #36 Kling 3.0 for B-roll (75% cost reduction)
- #39 Temporal for durable execution

### Strategic / Higher Effort (Plan For)
- #40 Dagster for incremental builds
- #41 Remotion Lambda for cloud rendering
- #43 Late API for multi-platform distribution
- Full Planner/Generator/Evaluator agent architecture

---

## Research Documents Produced

The following detailed research documents are available in `library/docs/`:

| Document | Content |
|----------|---------|
| `VIDEO-GEN-LANDSCAPE-2026Q1.md` | AI video generation models comparison (written by agent) |
| `AVATAR-ANIMATION-RESEARCH.md` | Avatar and character animation landscape (written by agent) |
| `AI-VIDEO-CREATIVE-TOOLS-RESEARCH.md` | Scripting, storyboarding, and creative direction tools (written by agent) |

The remaining 9 research reports are available in full in the conversation history covering: TTS, music generation, SFX/audio post-production, captioning, Remotion/motion graphics, video QA/scoring, pipeline orchestration, post-production/encoding, and distribution/analytics.

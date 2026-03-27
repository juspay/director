# Director Pipeline Library

Consolidated, reusable video production pipeline extracted from 6 version iterations (top-level, v2, v5, v7, v8, v9). Each module represents the best-in-class implementation across all versions.

## Directory Structure

```
library/
├── voiceover/          # TTS generation (6 providers) + genetic/Bayesian optimizer + scorer
├── music/              # Programmatic synthesis (2 engines) + config
├── sfx/                # Sound effect synthesis + ElevenLabs SFX API
├── mixing/             # Audio mixing with VAD ducking + compression
├── scoring/            # Video scoring (Gemini) + VMAF gating + VBench QA
├── rendering/          # Remotion orchestration + FFmpeg assembly + captioning
├── pipeline/           # Orchestrator, config, schemas, cost tracking, video generators
├── distribution/       # JSON-LD schema, platform distribution
├── remotion/           # Reusable Remotion components, animations, effects, scenes
├── prompts/            # Creative direction templates
└── docs/               # Architecture specs, methodology, research
```

## Modules

### Voiceover (`voiceover/`)
| File | Provider | Key Feature |
|------|----------|-------------|
| `genetic_optimizer.py` | ElevenLabs | Optuna Bayesian + genetic optimizer, 8-criterion acoustic scoring |
| `acoustic_scorer.py` | — | 9-criterion scorer (pacing, energy arc, MOS, etc.) |
| `openai_tts.py` | OpenAI | Prompt-steerable delivery ("speak with gravitas") |
| `fish_audio.py` | Fish Audio | 80% cheaper, 15-second voice cloning |
| `elevenlabs_generator.py` | ElevenLabs | eleven_v3 TTS with audio tags |
| `edgetts_stitcher.py` | Edge-TTS | Per-segment prosody, free tier |
| `chirp3_ssml.py` | Google | Chirp3-HD with SSML |
| `continuous_take.py` | ElevenLabs | Continuous-take-first strategy |
| `+ 4 more` | Various | Smallest.ai, Cartesia, Edge-TTS variants |

### Music & SFX (`music/`, `sfx/`)
| File | What It Does |
|------|-------------|
| `programmatic_synthesizer.py` | Full music synthesis: pad, bass, melody, percussion, variable BPM |
| `numpy_synthesizer.py` | Zero-dependency NumPy-only synthesizer |
| `karplus_strong.py` | Physically-modeled SFX (plucked string, sub pulse, shimmer) |
| `ui_sounds.py` | 5 UI SFX from mathematical primitives |
| `elevenlabs_sfx.py` | ElevenLabs SFX v2 API with 7 preset prompts |

### Mixing (`mixing/`)
| File | What It Does |
|------|-------------|
| `vad_mixer.py` | Silero VAD + frequency-aware ducking (200-4000Hz only) + Pedalboard compression/limiting + LUFS measurement |

### Scoring (`scoring/`)
| File | What It Does |
|------|-------------|
| `gemini_video_scorer.py` | Gemini 2.5 Flash/Pro, context caching, shuffled rubric, low-res mode |
| `vmaf_gating.py` | VMAF regression detection between iterations |
| `vbench_checker.py` | VBench temporal flickering + motion smoothness |
| `reference_comparator.py` | Reference/score/compare modes with industry benchmarks |

### Rendering (`rendering/`)
| File | What It Does |
|------|-------------|
| `assembler.py` | FFmpeg assembly with color grading, -tune animation, multi-format |
| `caption_burner.py` | WhisperX transcription, WER validation, SRT validation, FFmpeg burn-in |
| `remotion_renderer.py` | Remotion render orchestration |
| `asset_validator.py` | Pre-render validation gate |
| `green_screen.py` | FFmpeg colorkey → VP9 alpha → composite |
| `ken_burns.py` | Screenshot zoom + cross-dissolve |

### Pipeline (`pipeline/`)
| File | What It Does |
|------|-------------|
| `orchestrator.py` | 6-phase async pipeline (VO → Avatar+Broll → Music → Composite → Captions) |
| `pipeline_config.py` | 14 encoding presets (H.264, AV1, VideoToolbox, YouTube, TikTok, etc.) |
| `cost_tracker.py` | JSONL cost logging with auto-estimation across 7 providers |
| `kling_generator.py` | Kling 3.0 video generation (75% cheaper than Runway) |
| `veo_generator.py` | Veo 3.1 via Gemini API (native 4K + audio) |

### Remotion (`remotion/`)
- **14 components**: AnimatedDotGrid, SlackMessage, GlitchText, ProgressTrack, etc.
- **7 animation modules**: transitions, layers, connections, pulses, typography, camera
- **8 effects**: chromatic aberration, morph transitions, particle debris, lens flare, etc.
- **7 utilities**: easing, timing, springs (17 presets), theme, pseudoRandom
- **16 reference scenes**: best implementations from each version

## Quick Start

```bash
# Install dependencies
pip install -r library/pipeline/requirements.txt

# Generate voiceover (Optuna optimization)
python library/voiceover/genetic_optimizer.py --optimizer optuna --rounds 15

# Score a video
python library/scoring/gemini_video_scorer.py score --tier dev --video render.mp4

# Check for regression
python library/scoring/vmaf_gating.py current.mp4 previous_best.mp4

# Generate B-roll (Kling 3.0)
python library/pipeline/kling_generator.py "Developer coding at night, amber glow" --duration 5
```

## Detailed Documentation

See `docs/` for:
- `PIPELINE-IMPROVEMENT-PLAN.md` — 51-item improvement roadmap with priority matrix
- `iteration-methodology.md` — How to run iterative video production
- `version-evolution.md` — What each version contributed
- `scoring-rubrics.md` — All 3 rubric systems (7-dim video, 11-criterion script, 9-criterion acoustic)
- `VIDEO-GEN-LANDSCAPE-2026Q1.md` — AI video generation landscape
- `AVATAR-ANIMATION-RESEARCH.md` — Avatar and character animation options

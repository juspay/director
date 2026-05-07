# Director — TypeScript-Primary AI Video Production Pipeline

[![CI](https://github.com/juspay/director/actions/workflows/ci.yml/badge.svg)](https://github.com/juspay/director/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-20%20%7C%2022%20%7C%2024-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-53%20passing-brightgreen)](#verification)

TypeScript-first video production pipeline powered by `@juspay/neurolink` for AI scoring, analysis, and creative direction. Python used only for NumPy/SciPy DSP (called via `execa` subprocess).

## Architecture

```
src/                          ← TypeScript (primary)
├── agents/                   # Neurolink AI agents (6 + scene-narrator)
├── schemas/                  # Zod schemas for structured AI output
├── voiceover/                # TTS (ElevenLabs, OpenAI, Fish, EdgeTTS, Google via NeuroLink TTSProcessor)
├── generators/               # Video gen (Kling, Veo via NeuroLink, Runway, Wan-Alpha)
├── rendering/                # FFmpeg assembler + NeuroLink mergeVideoBuffers/frameExtractor, captions, presets
├── avatar/                   # Lip sync (MuseTalk, D-ID)
├── music/                    # Music gen (Lyria, Beatoven, ElevenLabs)
├── distribution/             # Mux + Late publishing (HITL-gated) + PPT companion
├── scoring/                  # VMAF, cost tracker, AI scoring + quality-gates (7 LLM scorers) + multi-judge ensemble
├── adapters/                 # Unified TTSHandler/VideoGenHandler/etc. registry for direct-fetch vendors
├── rag/                      # NeuroLink chunkText + sparse retrieval over docs/*.md
├── policies/                 # 3-cycle policy system: Creator → Enforcer → Validator
├── observability/            # Observer → Evaluator → SuperObserver → Reporter (NeuroLink Langfuse layered on top)
├── pipeline/                 # Runner (7-phase + Director-Mode), config, state, Langfuse init
├── scripts/                  # Python bridge (execa wrappers)
└── types/                    # TypeScript interfaces

scripts/python/               ← Python (subprocess only — NumPy/SciPy DSP)
├── synthesize-music.py       # Programmatic music synthesis
├── synthesize-sfx.py         # Karplus-Strong SFX
├── mix-audio.py              # VAD ducking, Pedalboard compression
└── analyze-audio.py          # librosa spectral analysis

tests/                        ← Node built-in test runner (zero new deps)
├── utils/                    # json-repair, rate-limit
├── policies/                 # policy-enforcer (all 5 conditions)
├── schemas/                  # Zod validation + weight invariants
├── pipeline/                 # config, state (save/load/append)
├── observability/            # agent-observer metrics
└── scripts/                  # python-bridge integration
```

## Quick Start

```bash
# Copy the env template and fill in provider keys
cp .env.example .env

npm install
node --import tsx src/pipeline/runner.ts --help

# Full pipeline
node --import tsx src/pipeline/runner.ts --script script.md --provider elevenlabs --video-gen kling

# Specific phases
node --import tsx src/pipeline/runner.ts --phases 1,5,6,7 --script script.md

# Dry run (no API keys needed)
node --import tsx src/pipeline/runner.ts --dry-run

# Score a video
node --import tsx src/agents/video-scorer.ts
```

## Verification

All of these run without API keys — they prove the codebase is structurally correct.

| Check | Command | Proves |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | 0 type errors across all `.ts` files |
| Unit tests | `npm run test:unit` | 50 tests covering utils, policies, schemas, config, state, observability |
| Python tests | `npm run test:python` | 3 integration tests — all 4 DSP scripts respond to `--help` |
| Full suite | `npm test` | All 53 tests |
| Dry-run | `node --import tsx src/pipeline/runner.ts --dry-run` | All 7 phases execute without errors |

CI runs the typecheck + unit tests + dry-run on Node 20, 22, and 24 on every push.

## Configuration

All secrets are loaded from `.env` via `dotenv`. See `.env.example` for the full list. Key environment variables:

| Variable | Purpose | Required for |
|----------|---------|--------------|
| `PRODUCT_NAME` / `PRODUCT_DESCRIPTION` | Context injected into scoring prompts | AI scoring |
| `GEMINI_API_KEY` | Gemini / Lyria | AI agents + music |
| `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `FISH_AUDIO_API_KEY` | TTS providers | Voiceover (pick 1+) |
| `KLING_API_KEY`, `RUNWAY_API_KEY`, `GOOGLE_CLOUD_PROJECT` | Video generation | B-roll (pick 1) |
| `DID_API_KEY`, `REPLICATE_API_TOKEN` | Avatar lip-sync | Avatar phase |
| `LATE_API_KEY`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | Distribution | Publishing |

## Stats

48 TypeScript files · 53 tests passing · 0 type errors · 14 encoding presets · 6 AI agents · 7 pipeline phases

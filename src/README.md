# Director — TypeScript-Primary AI Video Production Pipeline

TypeScript-first video production pipeline powered by `@juspay/neurolink` for AI scoring, analysis, and creative direction. Python used only for NumPy/SciPy DSP (called via `execa` subprocess).

## Architecture

```
src/                          ← TypeScript (primary)
├── agents/                   # Neurolink AI agents (6 agents, Zod schemas)
├── schemas/                  # Zod schemas for structured AI output
├── voiceover/                # TTS providers (ElevenLabs, OpenAI, Fish, EdgeTTS) + optimizer
├── generators/               # Video generators (Kling, Veo, Runway, Wan-Alpha)
├── rendering/                # FFmpeg assembler, Remotion renderer, captions, 14 presets
├── avatar/                   # Lip sync (MuseTalk, D-ID)
├── music/                    # Music generators (Lyria, Beatoven, ElevenLabs)
├── distribution/             # Multi-platform publishing (Late API, Mux, JSON-LD)
├── scoring/                  # VMAF gating, VBench, cost tracker + AI scoring agents
├── policies/                 # 3-cycle policy system: Creator → Enforcer → Validator
├── observability/            # Observer → Evaluator → SuperObserver → Reporter
├── pipeline/                 # Runner (7-phase), config, state management
├── scripts/                  # Python bridge (execa wrappers)
└── types/                    # TypeScript interfaces

scripts/python/               ← Python (subprocess only — NumPy/SciPy DSP)
├── synthesize-music.py       # Programmatic music synthesis
├── synthesize-sfx.py         # Karplus-Strong SFX
├── mix-audio.py              # VAD ducking, Pedalboard compression
└── analyze-audio.py          # librosa spectral analysis
```

## Quick Start

```bash
npm install
npx tsx src/pipeline/runner.ts --help

# Full pipeline
npx tsx src/pipeline/runner.ts --script script.md --provider elevenlabs --video-gen kling

# Specific phases
npx tsx src/pipeline/runner.ts --phases 1,5,6,7 --script script.md

# Dry run
npx tsx src/pipeline/runner.ts --dry-run

# Score a video
npx tsx src/agents/video-scorer.ts

# Typecheck
npm run typecheck
```

## 48 TypeScript files | 0 type errors | 14 encoding presets | 6 AI agents

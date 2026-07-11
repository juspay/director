<div align="center">

# 🎬 Director

### From a script to a scored, on-brand, ship-ready video — directed by AI.

Director is a TypeScript-first **autonomous video production pipeline**. Hand it a script; it writes the creative direction, generates a consistent on-brand b-roll film, scores the cut with a panel of AI judges, and produces a captioned, loudness-mastered deliverable — resume-safe and cost-tracked end to end.

[![CI](https://github.com/juspay/director/actions/workflows/ci.yml/badge.svg)](https://github.com/juspay/director/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-22%20%7C%2024-3c873a)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-177%20passing-brightgreen)](#-quality--testing)
[![Powered by NeuroLink](https://img.shields.io/badge/powered%20by-NeuroLink-7c3aed)](https://github.com/juspay/neurolink)

</div>

---

## Why Director

Most "AI video" tools stitch a few API calls together and hand you whatever comes back. Director treats production like a studio does — **plan, generate, critique, score, master** — and automates the whole loop:

- 🎯 **Director Mode** — an AI art-director plans the shot list from your script, then a **product-consistency critic inspects every still keyframe and rejects off-brand frames _before_ they're animated.** You don't pay to animate a wrong-colored product, and the final film reads as one coherent piece.
- ⚖️ **Multi-judge consensus scoring** — a panel of multimodal judges (Gemini Flash + Pro) each rate the cut on a 7-dimension rubric; the **median consensus** is robust to a single noisy critic, with per-dimension scores and an agreement signal.
- 🛡️ **Quality gates & a deterministic regression gate** — LLM content scorers (toxicity, bias, faithfulness) with confidence-aware "inconclusive" handling, plus a model-free **VMAF + VBench** gate that only fails on a *measured* regression.
- 🔌 **Provider-agnostic** — swap TTS, video, music, avatar, and image providers with a single flag, all behind one `@juspay/neurolink` integration (13+ LLM providers).
- ♻️ **Resume-safe & parallel** — every phase checkpoints to disk; b-roll scenes render concurrently; an interrupted run picks up exactly where it left off.
- 💰 **Cost-tracked & observable** — per-phase cost accounting, agent metrics, policy-compliance reports, and optional Langfuse tracing.

---

## The Pipeline

```
            ┌──────────────────────────── script.txt ────────────────────────────┐
            │                                                                      │
   ① Voiceover            ② Avatar              ③ B-roll (Director Mode)    ④ Music
   TTS / scene-       HeyGen · D-ID ·     art-director → keyframe → critic →  Lyria · Beatoven ·
   narrator one-shot   Replicate          ✅on-brand? → Veo animate → concat   NumPy DSP
            │                    └──────────── run concurrently ───────────┘        │
            └──────────────────────────────────┬───────────────────────────────────┘
                                                ▼
                          ⑤ Render → ⑥ Assembly → ⑦ Captions
                       (cinematic color grade · EBU R128 −14 LUFS master · phrase-aware SRT)
                                                ▼
                       Post-production: multi-judge score · quality gates · cost summary
                                                ▼
                                    🎞️  final_captioned.mp4  + production verdict
```

Each of the 7 phases is independently runnable (`--phases 1,5,6,7`) and resumable.

---

## Quick Start

> **Requirements:** Node ≥ 22, `ffmpeg` + `ffprobe` on `PATH`, and Python 3.11 with `numpy scipy librosa` (only for the DSP music/SFX path).

```bash
git clone https://github.com/juspay/director.git
cd director
npm install

cp .env.example .env        # add the provider keys you intend to use

# Print the plan for all 7 phases — no API keys required
node --import tsx src/pipeline/runner.ts --dry-run
```

Then run a real production:

```bash
# Default: Director-Mode b-roll @ 1080p, single-critic scoring
npm start -- --script assets/script.txt

# The full studio treatment: consensus scoring on a director-planned film
npm start -- --script assets/script.txt --broll-mode director --scoring multi-judge

# Cheaper / faster iteration
npm start -- --script assets/script.txt --resolution 720p --broll-mode concept
```

---

## Usage

> Driving Director with an AI coding assistant (inspect, repair, or compose runs)? Start at [AGENT_GUIDE.md](AGENT_GUIDE.md).

### CLI reference

```
node --import tsx src/pipeline/runner.ts [options]
```

| Option | Description |
|--------|-------------|
| `--script PATH` | Script / brief for the run (defaults to `assets/script.txt`) |
| `--phases 1,2,3` | Run specific phases only (default: all 7) |
| `--broll-mode MODE` | `director` (default) · `concept` · `generic` |
| `--scoring MODE` | `single` (default) · `multi-judge` (consensus panel) |
| `--narration MODE` | `script` (default — file + TTS) · `narrator` (AI writes narration + TTS in one call) |
| `--resolution RES` | `1080p` (default) · `720p` |
| `--provider NAME` | TTS: `openai` · `elevenlabs` · `google-tts` · `fish` · `edgetts` |
| `--video-gen NAME` | Video: `veo` · `kling` · `runway` · `wan-alpha` · `hailuo-fast` · `wan-2.7` |
| `--music-gen NAME` | Music: `lyria` · `beatoven` · `elevenlabs` · `numpy` |
| `--avatar-provider` | Avatar: `heygen` · `did` · `replicate` |
| `--avatar-id ID` | Provider avatar id (required by HeyGen; or `HEYGEN_AVATAR_ID`) |
| `--output DIR` | Output directory for artifacts |
| `--skip-scoring` | Skip post-pipeline AI scoring |
| `--dry-run` | Print the plan without executing |
| _(env)_ `BROLL_CONCURRENCY=N` | Parallel b-roll scenes (default 3) |

### Standalone tools

| Command | What it does |
|---------|--------------|
| `npm run score` | Score an existing video with the multimodal rubric |
| `npm run gate -- <current> [reference]` | Deterministic VMAF/VBench regression gate (exit 1 on regression) |
| `npm run direct -- <script> [--brand-voice]` | Generate creative direction (optionally brand-voice-grounded) |
| `npm run analyze` / `npm run compare` | Scene analysis · A/B video comparison |
| `npm run dashboard` / `npm run report` | Generate the run dashboard · observability report |

---

## Providers

One flag swaps any stage. Everything routes through `@juspay/neurolink`, except the deterministic DSP path (Python) and the direct HeyGen REST adapter.

| Stage | Options |
|-------|---------|
| **Voiceover (TTS)** | OpenAI · ElevenLabs · Google · Fish Audio · Edge-TTS · single-call scene-narrator |
| **B-roll / video** | Veo (Vertex) · Kling · Runway · Wan-Alpha (Replicate) |
| **Image keyframes** | Vertex Gemini image *(default)* · OpenAI |
| **Music** | Lyria · Beatoven · ElevenLabs · NumPy/SciPy DSP synthesis |
| **Avatar / lip-sync** | HeyGen *(direct REST adapter)* · D-ID · Replicate (MuseTalk) |
| **Distribution** | Mux hosting · Late publishing — both HITL-gated |

---

## Quality, Scoring & Observability

Director doesn't just generate — it **judges its own output** and refuses to call it done without evidence.

- **Multi-judge video scoring** (`src/scoring/multi-judge-scorer.ts`) — a panel of judges score 7 weighted dimensions (content authenticity, visual polish, motion design, storytelling arc, scene transitions, music/audio, production value); aggregated to a median consensus with variance-based agreement.
- **Quality gates** (`src/scoring/quality-gates.ts`) — LLM scorers for narration content; low-confidence or unparseable verdicts are *inconclusive* (never silently counted as a pass or fail).
- **Regression gate** (`src/scoring/regression-gate.ts`) — VMAF (vs a reference) + VBench temporal quality; lenient by design — it only fails on a measured regression, never on missing tooling.
- **Production verdict** — combines the video score with the content gates into a single `SHIP-READY` / `NEEDS WORK` call.
- **Cost tracking & observability** — per-phase spend (incl. Veo per-second), agent metrics, a 3-cycle policy system (Creator → Enforcer → Validator), and optional Langfuse tracing.

---

## Project Structure

```
src/
├── pipeline/        7-phase runner (+ Director Mode), config, resume-safe state
├── agents/          10 NeuroLink agents — art-director, consistency-critic,
│                    creative-director, scene-narrator, video-scorer, …
├── schemas/         Zod schemas for every structured AI output
├── scoring/         multi-judge · quality-gates · regression-gate · cost-tracker
├── voiceover/ generators/ music/ avatar/   provider routers (TTS · video · music · avatar)
├── rendering/       FFmpeg assembler, cinematic grade, loudness master, caption burner
├── rag/             brand-voice retrieval over docs/*.md
├── distribution/    Mux + Late publishing (HITL-gated) + PPT companion
├── observability/   observer → evaluator → super-observer → reporter
└── policies/        Create → Enforce → Validate

scripts/python/      NumPy/SciPy DSP (music · SFX · mixing · analysis) via execa
tests/               177 tests on Node's built-in runner (zero extra deps)
```

---

## 🧪 Quality & Testing

Every check below runs **without API keys** — they prove the codebase is structurally sound.

| Check | Command | Proves |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | 0 type errors (strict TypeScript) |
| Unit tests | `npm run test:unit` | 177 tests — scoring, pipeline, schemas, utils, avatar, observability |
| Python tests | `npm run test:python` | DSP bridge integration |
| Build | `npm run build` | Clean `dist/` emit |
| Dry-run | `node --import tsx src/pipeline/runner.ts --dry-run` | All 7 phases wire up cleanly |

CI runs typecheck → build → unit tests → dry-run on **Node 22 & 24** for every push and PR.

---

## Configuration

Secrets load from `.env` (see `.env.example`). Add only the keys for the providers you use.

| Variable | Used for |
|----------|----------|
| `GOOGLE_CLOUD_PROJECT` / `GOOGLE_APPLICATION_CREDENTIALS` | Vertex (Veo, Gemini image, scoring) |
| `OPENAI_API_KEY` · `ELEVENLABS_API_KEY` · `FISH_AUDIO_API_KEY` | TTS providers |
| `KLING_API_KEY` · `RUNWAY_API_KEY` · `REPLICATE_API_TOKEN` | Video / avatar generation |
| `HEYGEN_API_KEY` · `HEYGEN_AVATAR_ID` · `HEYGEN_VOICE_ID` | HeyGen avatar |
| `BEATOVEN_API_KEY` | Music generation |
| `MUX_TOKEN_ID` · `MUX_TOKEN_SECRET` · `LATE_API_KEY` | Hosting & publishing |
| `PRODUCT_NAME` · `PRODUCT_DESCRIPTION` | Context injected into creative & scoring prompts |
| `LANGFUSE_PUBLIC_KEY` · `LANGFUSE_SECRET_KEY` | Optional tracing |

---

## Tech Stack

**TypeScript** (strict) · **Node ≥ 22** · [`@juspay/neurolink`](https://github.com/juspay/neurolink) for all AI · **Zod** for structured output · **FFmpeg** for assembly/encoding · **Python (NumPy/SciPy/librosa)** for DSP · **Node's built-in test runner** (no extra test deps).

---

<div align="center">

**Director** · part of the [Juspay](https://github.com/juspay) AI tooling ecosystem · © Juspay Technologies

</div>

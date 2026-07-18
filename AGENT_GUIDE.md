# Agent Guide — driving Director as a coding agent

Director is a self-contained code engine: `npm start` runs the whole 7-phase
pipeline deterministically, no agent required. This guide is the *other* mode —
for an AI coding assistant (Claude Code, Cursor, Copilot, Codex, …) that has
been asked to drive, inspect, or repair a production run. Everything below is a
documented, stable entry point; nothing requires reading the pipeline source.

Why this exists: the July 2026 competitive research
(`docs/plans/2026-07-10-competitive-research-roadmap.md`, P1-2) showed the
strongest rival architecture makes the coding agent *the* orchestrator. Director
keeps its deterministic engine as the product — but every phase and quality
check is individually invocable, so an agent can compose them when the fixed
graph isn't what the situation needs.

## The 60-second model

- **One run = one output dir.** All artifacts land in `--output <dir>` (default
  `output/`), and all run state lives in `<outDir>/.pipeline-state/`:
  `pipeline-state.json` (resume checkpoint), `cost_log.jsonl` (real spend),
  `agent-metrics.jsonl` (per-phase timing/success), `shot-plan.json` +
  `shot-verdicts.jsonl` (director-mode b-roll evidence).
- **Resume is file-based and safe.** Re-running the same command with the same
  `--output` skips phases already in `results`. Kill it whenever; resume costs
  nothing extra.
- **Phases**: 1 voiceover → 2 avatar → 3 b-roll → 4 music → 5 render →
  6 assembly → 7 captions (2–4 run concurrently). Post-pipeline: AI scoring,
  content-safety gates, deterministic regression gate, production verdict.

## Run it

```bash
npm install && cp .env.example .env   # see "Keys" below
node --import tsx src/pipeline/runner.ts --help   # every flag, current truth

npm start -- --script assets/script.txt --output runs/demo        # full run
npm start -- --dry-run --output /tmp/smoke                        # $0 wiring check
npm start -- --script s.txt --broll-mode cards --phases 1,3,4,6   # $0 typography cut
npm start -- --script s.txt --budget 10                           # hard spend cap
```

Spend controls an agent should always consider:
- `--budget USD` / `BUDGET_USD` — whole-run cap; the pre-flight projection
  aborts b-roll *before* the first paid call if it wouldn't fit. The projection
  line (`[Pre-flight] projected spend: …`) prints either way — read it.
- `--broll-mode cards` — the $0 tier (no video-gen keys needed at all).
- `--resolution 720p --broll-mode concept` — the cheap-iteration tier.
- `BROLL_MAX_SHOTS`, `BROLL_MAX_REGEN`, `VERTEX_VIDEO_PER_SEC`,
  `VERTEX_IMAGE_PER_IMAGE` — bound or re-price the cost drivers.

## Inspect a run

```bash
npm run backlot                        # live dashboard: auto-finds the newest run,
                                       # liveness (running/stalled), per-shot grid,
                                       # critic verdicts, real spend
cat <outDir>/.pipeline-state/pipeline-state.json | jq '.results | keys'
cat <outDir>/.pipeline-state/cost_log.jsonl      # every billed call, per unit
cat <outDir>/.pipeline-state/shot-verdicts.jsonl # what the critic ruled, per attempt
```

## Judge the output (each is a standalone CLI)

```bash
npm run score   -- <video>             # single-judge rubric score
npm start -- --scoring multi-judge …   # Flash+Pro median-consensus panel
npm run gate    -- <video> [baseline]  # deterministic VMAF/VBench regression gate
npm run compare -- <a> <b>             # A/B comparison
npm run analyze -- <video>             # scene-by-scene analysis
npm run observe                        # post-run observability sweep + penalties
```

## Repair playbook

| Symptom | Move |
|---|---|
| Run died mid-phase | Re-run the same command — resume skips completed phases |
| One phase produced garbage | Delete its artifact(s) from `<outDir>` and its key from `results` in `pipeline-state.json`, then re-run |
| B-roll went off-brand | Read `shot-verdicts.jsonl` for the critic's reasoning, then `--regen-shot N --phases 3,6,7` — clears that shot's cached keyframe+segment and re-runs b-roll, assembly, captions; upstream phases stay cached. (`--regen-shot N,M` for several; the old delete-the-cache-file workaround still works but is no longer needed) |
| Spend runs away | Kill it; add `--budget` and/or lower `BROLL_MAX_SHOTS`; resume |
| "Is it alive?" | `npm run backlot` — `RUNNING` vs `STALLED` is derived from state-file mtimes (`BACKLOT_STALL_SECONDS` to tune) |
| Need the verdict trail | `output/quality-gates.json`, `output/regression-gate.json`, scoring block in `pipeline-state.json` |

Rules of engagement for agents:
- Never edit files under `<outDir>/.pipeline-state/` except the documented
  repair above; never write to a *different* run's state dir.
- Prefer flags/env over source edits — every knob above is stable API.
- Report costs from `cost_log.jsonl`, not from your own estimates.

## Keys (minimal viable set)

| Need | Keys |
|---|---|
| Default full run | `OPENAI_API_KEY` (TTS) + `GOOGLE_CLOUD_PROJECT` + `GOOGLE_APPLICATION_CREDENTIALS` (Vertex: images, Veo b-roll, all scoring agents) |
| $0 cards run | none (ffmpeg only) |
| Alt TTS / music / video-gen | `ELEVENLABS_API_KEY`, `KLING_*`, `RUNWAY_*`, `REPLICATE_API_TOKEN`, … (see `.env.example`) |
| Avatar phase (optional) | `HEYGEN_API_KEY` + `HEYGEN_AVATAR_ID`, or D-ID/Replicate |

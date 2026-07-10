# Competitive research → roadmap (July 2026)

**Status:** proposed · **Owner:** core · **Source:** the July 2026 landscape/deep-dive/bake-off research cycle.

## Where this comes from

Three-stage research, each stage code-grounded rather than README-grounded:

1. **Landscape** — 61 verified GitHub projects mapped across 7 clusters (agents & pipelines, faceless short-form, workflow orchestration, T2V engines, programmatic editing, phase point-solutions, scoring/benchmarks). No 1:1 Director clone exists; the closest are OpenMontage (35k★), ViMax (11k★), video-db/Director (1.4k★).
2. **Deep dive** — those three cloned and read line-by-line: 16-axis capability matrix, per-repo strengths/gaps, five honest threats.
3. **Bake-off** — all three actually *run* on the same brief by autonomous agents (same machine, same credential pool, spend caps), audited by independent verifiers, against our real production run as baseline.

| System | Outcome | Effort (1–5) | Wall | Spend |
|---|---|---|---|---|
| Director (ours) | finished 32.3s cut — VO + music + captions + grade | 3 | ~10.5 min | $14.40 *logged* (understated — see P0-1) |
| OpenMontage | finished 30.0s text-card promo — narration + music | 4 | ~68 min | $0 |
| ViMax | 8.0s 2-shot clip — no VO/music/captions | 4 | ~45 min | ~$2 (+ ~$6–9 to actually reach 30s) |
| video-db/Director | blocked — VideoDB SaaS key required for *every* chat turn | 2 (to boot) | 9 min | $0 |

## Already landed from this research

| PR | What | Origin |
|---|---|---|
| [#64](https://github.com/juspay/director/pull/64) | VMAF/VBench regression gate wired into every run | Deep-dive finding: our best gate was manual-only while OpenMontage's weaker gates were wired |
| [#65](https://github.com/juspay/director/pull/65) | `currentStep` tracking, resume-safe cost log, est-vs-actual cost labeling | Blueprint investigation fallout |
| [#66](https://github.com/juspay/director/pull/66) | Backlot Phase A — read-only live run dashboard | Stolen from OpenMontage's best idea |
| [#68](https://github.com/juspay/director/pull/68) | Per-run state isolation (`<outDir>/.pipeline-state`) | Bake-off baseline audit: cross-run state bleed |

## P0 — correctness & credibility (small, do now)

### P0-1 · Cost-log coverage
`cost_log.jsonl` records only 2 of 7 phases (TTS chars, b-roll video seconds). Every image generation — 1 hero + up to 3 attempts × 8 shots per director-mode run — plus all agent LLM calls and post-pipeline scoring bill real money that never reaches the log, so run totals materially understate spend. *(In flight as the follow-up PR to #68: per-image rates + logging at the `generateImage` choke point; LLM token logging blocked on NeuroLink not surfacing usage — worth an upstream ask.)*

### P0-2 · Pre-flight spend estimate
The shot plan fixes shot count, segment length, and image attempts before the first paid call, and the rate table already exists in `cost-tracker.ts` — print a projected cost line (and optionally honor a `--budget` cap) before animation starts. ViMax's bake-off failure mode is the cautionary tale: its architecture has no concept of total duration vs spend, so the "30s brief" quietly became an 8s video at the cap.

## P1 — product bets from the research (medium)

### P1-1 · Zero-API b-roll mode ("the OpenMontage $0 lesson")
OpenMontage delivered a finished, on-brief 30s promo with narration and music for **$0 logged** — because its HyperFrames renderer builds typography/motion-graphic scenes locally instead of calling video-gen APIs. Director's no-keys fallback is a gradient seed ("generic" mode), which is a demo, not a deliverable. We already ship a Remotion phase (currently a pass-through in most runs): a `--broll-mode cards` that renders script-derived text-card scenes through it would give Director a credible $0 output tier for drafts, previews, and CI. The trade is explicit: no product imagery, typography is the visual.

### P1-2 · Agent-drivable mode (answer OpenMontage's architecture bet deliberately)
The bake-off proved both halves of the argument. For: a coding agent really did orchestrate OpenMontage end-to-end, inheriting whatever frontier model the user runs. Against: that same run needed a human-grade salvage — a false-negative tool failure and six stall-reaper deaths — because the audit trail and reliability are only as good as the driving agent (its celebrated hard gates never even executed on the renderer path it chose). Recommendation: keep the code engine as the product, but publish the phase functions as documented, individually-invocable entry points (they nearly are already — `score`, `gate`, `direct`, etc.) plus an `AGENT_GUIDE.md` so a coding agent can drive/repair runs. Cheap to do; hedges the architectural bet without giving up determinism.

### P1-3 · Upstream contributions (goodwill + de-risk our own deps)
The bake-off left real patches sitting in clones: 4 ViMax fixes (trailing-comma-tolerant JSON parsing for flash-lite, invalid `generate_audio` param on the public Gemini API, flf2v→ff2v fallback, a masking `.status_code`→`.code` bug in its 429 handler) and 2 OpenMontage bug reports (compose tool's two-base output-path false negative; `full_mix` having no total-duration input). Filing these as upstream PRs/issues is cheap and makes the research citable.

## P2 — deliberate decisions (big, decide rather than drift)

### P2-1 · Existing-video surface: explicitly out of scope
video-db/Director occupies "chat with / edit / dub / censor footage you already have," backed by a SaaS. The bake-off showed how totalizing that dependency is (no local fallback for *anything*). Recommendation: Director stays a generation pipeline; we revisit only on concrete product pull. Recording the decision here is the point — the threat analysis called out "losing by omission."

### P2-2 · Multi-shot continuity (camera trees)
ViMax's one genuinely enviable capability: an LLM infers parent/child camera coverage across shots and back-derives new camera keyframes from generated transition videos (`agents/camera_image_generator.py`). Director's product-bible + hero-reference conditioning solves *product* consistency, not *spatial/narrative* consistency across cuts. If multi-scene storytelling lands on the roadmap, study this prior art first (noting its consistency *checker* was dead code — the tree construction is the part that works).

### P2-3 · Backlot Phases B–D
Phase A (read-only dashboard) shipped in #66. The staged blueprint: **B** — liveness from state-file mtime (running/stalled distinction), SSE push instead of polling; **C** — per-scene b-roll grid with keyframe thumbnails + critic verdicts; **D** — run switching + replay scrubber over the event history. B is small and high-value now that #68 gives Backlot per-run state dirs to enumerate.

## Explicitly not doing

- **Novel/long-form adaptation** (ViMax `novel2movie`) — no product pull; revisit only with a concrete use case.
- **Chat/conversational UX** for the pipeline — Backlot covers observability; the CLI + resume covers control.
- **Retrieval/stock-footage b-roll** — the entire faceless-shortform cluster does this; generation-with-consistency is the differentiator worth defending.

## Evidence

- Research artifact (landscape + deep dive + verified bake-off): internal Claude artifact `director-deepdive-bakeoff`, July 2026.
- Bake-off raw outputs: per-system run dirs with command logs, verifier reports (ffprobe + frames), and finished videos.
- Deep-dive evidence trail: file:line citations per claim in the per-repo analyses (e.g. OpenMontage `video_compose.py:_pre_compose_validation`, ViMax `agents/best_image_selector.py` dead code, video-db `handler.py:109` session-init VideoDB coupling).

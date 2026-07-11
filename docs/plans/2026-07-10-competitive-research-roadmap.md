# Competitive research → roadmap (July 2026)

**Status:** proposed, corrected 2026-07-11 (see [Part III](#part-iii--the-wider-field-2026-07-11-correction)) · **Owner:** core · **Source:** the July 2026 landscape/deep-dive/bake-off research cycle.

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
| [#70](https://github.com/juspay/director/pull/70) | Per-image cost logging at the `generateImage` choke point | **P0-1 ✓** |
| [#71](https://github.com/juspay/director/pull/71) | Pre-flight spend projection + `--budget` cap | **P0-2 ✓** |
| [#72](https://github.com/juspay/director/pull/72) / [#74](https://github.com/juspay/director/pull/74) / [#76](https://github.com/juspay/director/pull/76) | Backlot Phases B–D (liveness+SSE, shot grid, run switching+replay) | **P2-3 ✓** |
| [#73](https://github.com/juspay/director/pull/73) | `--broll-mode cards` — the $0 output tier | **P1-1 ✓** |
| [#75](https://github.com/juspay/director/pull/75) | `AGENT_GUIDE.md` — agent-drivable entry points | **P1-2 ✓** |

## P0 — correctness & credibility (small, do now)

### P0-1 · Cost-log coverage
**✓ Landed in [#70](https://github.com/juspay/director/pull/70)** — per-image rates + logging at the `generateImage` choke point; b-roll seconds, cards, and stock tiers all log. Still open from the original finding: agent **LLM-call costs** (critic, doctor, scorers) remain unlogged, blocked on NeuroLink not surfacing token usage — the standing upstream ask.

### P0-2 · Pre-flight spend estimate
**✓ Landed in [#71](https://github.com/juspay/director/pull/71)** — `estimatePreflight` prices every b-roll path from the tracker's own rate table before the first paid call, and `--budget`/`BUDGET_USD` is a hard cap (`BudgetExceededError` fails the phase, never falls through to another paid path). The original cautionary tale stands: ViMax's "30s brief" quietly became an 8s video at the cap because nothing priced duration vs spend.

## P1 — product bets from the research (medium)

### P1-1 · Zero-API b-roll mode ("the OpenMontage $0 lesson")
**✓ Landed in [#73](https://github.com/juspay/director/pull/73)** as `--broll-mode cards` (via the caption pipeline rather than the Remotion phase — fewer moving parts, same $0 contract), joined later by the stock tier ([#78](https://github.com/juspay/director/pull/78)). Original rationale: OpenMontage delivered a finished 30s promo for **$0 logged** by building typography scenes locally; Director's no-keys fallback was a demo, not a deliverable. The trade remains explicit: no product imagery, typography is the visual.

### P1-2 · Agent-drivable mode (answer OpenMontage's architecture bet deliberately)
The bake-off proved both halves of the argument. For: a coding agent really did orchestrate OpenMontage end-to-end, inheriting whatever frontier model the user runs. Against: that same run needed a human-grade salvage — a false-negative tool failure and six stall-reaper deaths — because the audit trail and reliability are only as good as the driving agent (its celebrated hard gates never even executed on the renderer path it chose). **✓ Landed in [#75](https://github.com/juspay/director/pull/75)** — `AGENT_GUIDE.md` documents the run/state model, spend controls, judging CLIs, and a repair playbook; the phase CLIs were already individually invocable. The hedge is in place without giving up determinism.

### P1-3 · Upstream contributions (goodwill + de-risk our own deps)
The bake-off left real patches sitting in clones: 4 ViMax fixes (trailing-comma-tolerant JSON parsing for flash-lite, invalid `generate_audio` param on the public Gemini API, flf2v→ff2v fallback, a masking `.status_code`→`.code` bug in its 429 handler) and 2 OpenMontage bug reports (compose tool's two-base output-path false negative; `full_mix` having no total-duration input). Filing these as upstream PRs/issues is cheap and makes the research citable.

## P2 — deliberate decisions (big, decide rather than drift)

### P2-1 · Existing-video surface: explicitly out of scope
video-db/Director occupies "chat with / edit / dub / censor footage you already have," backed by a SaaS. The bake-off showed how totalizing that dependency is (no local fallback for *anything*). Recommendation: Director stays a generation pipeline; we revisit only on concrete product pull. Recording the decision here is the point — the threat analysis called out "losing by omission."

### P2-2 · Multi-shot continuity (camera trees)
ViMax's one genuinely enviable capability: an LLM infers parent/child camera coverage across shots and back-derives new camera keyframes from generated transition videos (`agents/camera_image_generator.py`). Director's product-bible + hero-reference conditioning solves *product* consistency, not *spatial/narrative* consistency across cuts. If multi-scene storytelling lands on the roadmap, study this prior art first (noting its consistency *checker* was dead code — the tree construction is the part that works).

### P2-3 · Backlot Phases B–D
**✓ Blueprint complete**: A [#66](https://github.com/juspay/director/pull/66) · B liveness + SSE [#72](https://github.com/juspay/director/pull/72) · C per-shot grid with critic verdicts [#74](https://github.com/juspay/director/pull/74) · D run switching + replay [#76](https://github.com/juspay/director/pull/76). Still a read-only, zero-dependency sidecar.

## Explicitly not doing

- **Novel/long-form adaptation** (ViMax `novel2movie`) — no product pull; revisit only with a concrete use case.
- **Chat/conversational UX** for the pipeline — Backlot covers observability; the CLI + resume covers control.
- ~~**Retrieval/stock-footage b-roll** — the entire faceless-shortform cluster does this; generation-with-consistency is the differentiator worth defending.~~ **Reversed 2026-07-11** (see Part III / W-P0-B): the wider-field scan showed stock retrieval is not a competitor's crutch but the industry's default middle tier — the differentiator argument confused "we also have generation" with "we must have only generation."

## Part III — the wider field (2026-07-11 correction)

The Parts I–II conclusion ("Director leads; the analogues trail") was a **category-sampling artifact**: the comparison set was three architectural look-alikes (substantial ones — OpenMontage 36.9k★, ViMax 11.1k★ — but look-alikes). A re-scan across six lenses (end-to-end OSS, composition frameworks, multi-agent research, commercial products, per-stage components, agent-native tooling) puts the actual field in frame. Numbers below verified 2026-07-11 via `gh api` and first-party pricing pages.

### What actually holds up

Four Director capabilities remain genuinely uncommon across the OSS field: the wired VMAF/VBench regression gate, JSONL cost accounting with pre-flight budget caps, LLM content-safety scoring on narration, and OTel/Langfuse tracing. Everything else in the Part II matrix was true only relative to the three clones.

### Corrected field view

| Category | Leaders (stars / status, 2026-07) | What they have that we don't |
|---|---|---|
| End-to-end OSS | MoneyPrinterTurbo 96.8k★ (active), NarratoAI 10.2k★, VideoLingo 17.7k★ | $0 stock b-roll with script-order matching; script-corrected Whisper subtitles; TikTok/IG/YT publishing in-pipeline; editable CapCut/JianYing project export |
| Composition | Remotion 52.8k★ (BUSL), motion-canvas 18.8k★, Revideo/Midrender 3.9k★ | Declarative motion graphics, kinetic typography, brand templates, multi-aspect re-render; official agent skill (126k installs) + `llms.txt`; MCP-speaking AI editor |
| Multi-agent research | FilmAgent → **VideoClaw** 1.6k★ (active 2026-06); Crayotter / VideoWeaver / AgenticVBench (arXiv 2606.*) | DoctorAgent auto-repair (diagnose → rewrite prompt → retry) on every media call; per-i2v-mode model routing; versioned assets + N-candidates + VLM best-pick; character/setting asset registry |
| Commercial | HeyGen Video Agent 2.0, Creatify, Arcads, Captions.ai, OpusClip | Prompt → blueprint **with cost preview** → editable motion-graphics video; URL→video; batch A/B variants; brand kits; publishing; word-level karaoke captions; voice cloning |
| Media APIs | fal.ai / Replicate; LTX-2.3, Wan 2.x, Kling 3.0, Seedance 2.0 | Hosted i2v from **$0.04/s (LTX Fast 1080p)** vs our Veo-only $0.20–0.40/s — a 10x spread we don't exploit |

**Strategic fact:** HeyGen — our avatar vendor — now sells the shape of our whole pipeline as a product (Video Agent 2.0: blueprint preview, credit estimate before render, editable motion graphics, Seedance+Avatar V auto-composition, `POST /v3/video-agents` API and an official CLI with structured JSON). Their CLI validates the AGENT_GUIDE direction; it also means "agent-drivable video pipeline" is not a moat. Director's defensible ground is what a SaaS can't offer: self-hosted, provider-portable, auditable spend/safety gates, deterministic resume.

### Corrected backlog (W = wider-field)

- **W-P0-A · Model-tiered b-roll routing** — draft tier (LTX-2.3 $0.04/s · Wan ~$0.07–0.10/s · Veo 3.1 Lite $0.03–0.05/s) for iterations/critic loops, hero tier (Veo/Kling) for finals. Routing **landed in [#79](https://github.com/juspay/director/pull/79)** (`--broll-tier draft|hero`). Honest caveat from the post-merge review: the rate table prices the four provider keys (vertex/runway/kling/replicate) — it has **no per-model rates**, so an LTX model routed through replicate prices at replicate's flat $0.09/s (not LTX's real $0.04/s), and vertex's single scalar cannot hold draft-Veo and hero-Veo rates simultaneously. Per-model rate keys are the remaining work if projection accuracy on draft tiers starts to matter. Expected ~5–10x b-roll cost cut from the $14.40/video baseline stands.
- **W-P0-B · Stock-footage b-roll tier** — Pexels/Pixabay/Coverr retrieval with script-order matching (MoneyPrinterTurbo `app/services/material.py` pattern) as `--broll-mode stock`, the middle tier between `cards` ($0, typography) and `director` (generated). Reverses the Part II non-goal, deliberately.
- **W-P1-A · Word-level karaoke captions** — ✓ **landed** in [#80](https://github.com/juspay/director/pull/80): `--caption-style karaoke`, per-word ASS `\k` sweep through the libass tier, word timings derived from the SRT (one code path for script and STT sources), graceful degradation to phrase captions without libass.
- **W-P1-B · Doctor loop on media calls** — ✓ **landed** in [#81](https://github.com/juspay/director/pull/81): all three b-roll animate sites wrapped in classify → (LLM prompt rewrite on safety blocks only) → bounded retry; budget aborts and invalid params never retried; `DOCTOR_RETRIES` tunes (default 1).
- **W-P1-C · Composition-layer spike** — ✓ **spike complete (2026-07-11)**, verdict recorded:
  - A minimal hand-scaffolded Remotion project (5 files, 182 packages, 13s install — the `create-video` scaffolder prompts interactively, so hand-scaffolding is the agent-friendly path) composited a pipeline MP4 with kinetic typography via `OffthreadVideo` + `useCurrentFrame`/`interpolate`.
  - **Warm render: 1.72s for a 3s 640×360 composition** (cold 14.5s incl. bundling) — fast enough to be a real per-scene assembly/caption backend, and `src/rendering/remotion-renderer.ts` already exists as the Phase 5 foothold.
  - **Recommendation:** adopt as an *optional* assembly/caption backend behind a flag; ffmpeg stays the default tier. **Blocker to resolve first: BUSL licensing** ($0 under \$1M ARR, company license above — a legal conversation at Juspay scale). Revideo has no license gate but far less adoption (~3k vs ~60k weekly npm downloads at the time of the scan). Decide the license question before any default-path integration.
- **W-P2-A · Keyframe candidates + versioning** — ✓ **landed in [#84](https://github.com/juspay/director/pull/84)**: `KEYFRAME_CANDIDATES` pools (clamped 1–4, default 1 = classic loop), critic best-pick, versioned candidate files on disk, pool priced into pre-flight.
- **W-P2-B · Distribution & hand-off** — ✓ **resolved as editable-project export, landed in [#85](https://github.com/juspay/director/pull/85)**: `npm run export:project` emits FCPXML (Final Cut Pro / DaVinci Resolve) with per-segment reorderable clips + connected voiceover/music lanes. Publishing integrations were deliberately not chosen (third-party accounts/tokens; revisit only on product pull).
- **W-DEC · HeyGen positioning** — ✓ **recorded in [#83](https://github.com/juspay/director/pull/83)** (`docs/plans/2026-07-11-heygen-positioning.md`, status *recommended*): differentiate on the pipeline, absorb Video Agent tactically as a provider, never wrap their agent.

### Research trail

Working notes with all verified numbers, source URLs, and clone paths: session scratchpad `research2/findings.md` (2026-07-11). Local deep-read clones: MoneyPrinterTurbo, VideoClaw, NarratoAI.

## Evidence

- Research artifact (landscape + deep dive + verified bake-off): internal Claude artifact `director-deepdive-bakeoff`, July 2026.
- Bake-off raw outputs: per-system run dirs with command logs, verifier reports (ffprobe + frames), and finished videos.
- Deep-dive evidence trail: file:line citations per claim in the per-repo analyses (e.g. OpenMontage `video_compose.py:_pre_compose_validation`, ViMax `agents/best_image_selector.py` dead code, video-db `handler.py:109` session-init VideoDB coupling).

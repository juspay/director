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
- **W-P0-B · Stock-footage b-roll tier** — ✓ **landed in [#78](https://github.com/juspay/director/pull/78)**: Pexels retrieval with script-order matching (MoneyPrinterTurbo `app/services/material.py` pattern) as `--broll-mode stock`, the middle tier between `cards` ($0, typography) and `director` (generated). Reverses the Part II non-goal, deliberately.
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

## Part IV — the missing tiers (2026-07-12)

A second completeness challenge named Higgsfield and Seedance as suspected misses. Both checked out: Higgsfield had zero coverage anywhere in Parts I–III; Seedance appeared only as a pricing footnote. A third research wave (16 agents: six tier lenses, an adversarial completeness critic, three gap-fill agents on the critic's findings; 254 live source fetches) closed the model-maker and creator-platform tiers.

### What Part III still got wrong

- **The bias, restated precisely:** anchoring on our own stack (Veo, HeyGen, Remotion-shaped tools) spotlighted Western, architecturally-similar players and missed where the money and usage actually sit. ByteDance (Seedance ~$1.8–2B annualized pace + CapCut 736M MAU), Kling ($3B raise at $18B — the largest-ever for a video model), MiniMax (HK IPO), fal (~$400M ARR) and Higgsfield ($500M ARR) are collectively larger than the entire familiar Western comparison set combined.
- **Veo — our sole b-roll source — is now ~#3 on quality**, behind Seedance 2.0 (#1 on both image-to-video and text-to-video-with-audio, Artificial Analysis July 2026) and contested by HappyHorse 1.1 and Grok Imagine 1.5 (#2 i2v). Veo's remaining unique strength: true 48 kHz synchronized dialogue.
- **The "cheap Seedance" footnote was wrong in both directions.** Accessible path (fal, official partner): $0.24–0.68/s — parity-to-worse vs Veo. Cheap path (BytePlus ~$0.01–0.03/s): ByteDance-linked enterprise KYC, India availability undocumented — a compliance question, not an engineering one. Best accessible route found: **Krea's dollar-metered API at $0.0677–0.0849/s** (verified 2026-07-12 on krea.ai's rate card; commercial-use licensed, account-only signup).
- **Higgsfield is both competitor and component:** Marketing Studio (URL → 15 ad variants in ~5 min) and Supercomputer 2.0 (autonomous marketing agents) do Director's job at $500M-ARR scale; its camera-control suite and hosted MCP/CLI (April 2026) are equally usable as a b-roll backend. Its recommended b-roll workflow (shot list → hero keyframe → first/last-frame lock → camera preset → i2v) mirrors Director's phase design exactly — independent validation of the architecture, from a competitor.
- **Agent-native became table stakes in H1 2026:** Higgsfield, Krea, PixVerse, Pollo and InVideo all shipped hosted MCP servers; Hedra shipped a brief→video orchestration agent. "Agent-drivable" now describes the market, not a differentiator. The four Part-III surviving properties (quality gates, cost governance, safety scoring, tracing) survive Part IV unchanged — still no public analog found, including no avatar-quality equivalent of an Elo arena.
- **Copyright became a procurement axis:** MPA's first-ever AI cease-and-desist (Seedance, Feb 2026), five studio C&Ds, SCOTUS declining *Thaler* (AI-only output uncopyrightable), Moonvalley selling indemnity as the product. Our content-safety scorers are part of an indemnity story, not just a quality gate.

### Part IV actions

- **W-P4-LANDSCAPE · Refresh the in-repo model landscape** — ✓ **landed in [#89](https://github.com/juspay/director/pull/89)**: `video-production/library/docs/VIDEO-GEN-LANDSCAPE-2026Q3.md` supersedes the Q1 doc, whose "Seedance BLOCKED — do not plan around it" warning has been false since April 2026.
- **W-P4-RATES · Per-model video rate keys** — the W-P0-A caveat graduates to prerequisite: cost-tracker's flat `replicate: $0.09/s` silently mis-prices every non-default model, which blocks honest multi-model tiering. ✓ **landed in [#90](https://github.com/juspay/director/pull/90)**: `MODEL_RATES` keyed `provider:model` (only page-verified rates), `VIDEO_MODEL_RATES` env override (explicit 0 = free), `model` recorded in the JSONL entries, and pre-flight projection threading the model so projection and billing stay on one rate.
- **W-P4-TIER2 · Draft-tier pilot on the zero-code path** — `minimax/hailuo-2.3-fast` and `wan-video/wan-2.7-i2v` (slugs verified on Replicate 2026-07-12) as named `BROLL_DRAFT_GENERATOR` aliases through the existing NeuroLink Replicate handler. ✓ **landed in [#91](https://github.com/juspay/director/pull/91)** (after #90): `--video-gen hailuo-fast|wan-2.7` / `BROLL_DRAFT_GENERATOR`, with the rate-honesty pointer to `VIDEO_MODEL_RATES` since Replicate publishes no per-second price for either model. **Live A/B addendum (2026-07-12): the aliases are wired correctly but blocked upstream** — NeuroLink's Replicate handler hardcodes the image under `image` while these models require `first_frame_image` / `first_frame` (verified against the live models API), so predictions fail on submit. Fix shipped upstream as [neurolink#1150](https://github.com/juspay/neurolink/pull/1150) (`imageInputKey`); completion path: bump NeuroLink on release, carry `imageInputKey` per `REPLICATE_MODEL` alias, and drop the `wan-alpha` alias (its slug `wechatcv/wan-alpha` was removed from Replicate — 404 — and NeuroLink's own default `atonamy/wan-alpha` turns out to be text-to-video-only).
- **W-P4-COMPLIANCE · Seedance/BytePlus vendor-risk review** — owner-level: the 13–40× path spread is a compliance decision; also verify Krea's 720p/1080p Seedance rates before budgeting around them — the base-resolution rates are verified (2026-07-12, krea.ai rate card: Seedance 2.0 $0.0849/s, Fast $0.0677/s, dollar-metered, commercial license), the higher-resolution multipliers are not.
- **W-P4-AVATAR-BENCH · Hedra + Tavus vs HeyGen** — the W-DEC concentration-risk action now has named candidates: Hedra Character-3 (~$0.031–0.06/s batch API, 720p cap) and Tavus Phoenix-4 (~$0.013–0.017/s overage, bundled plans). HeyGen still wins reviews on polish and languages — the benchmark should measure our actual avatar segment profile.

### Live A/B run — what the first real multi-model attempt taught (2026-07-12)

One 2×4s generic-mode leg per route, budget-capped, same brief. Results:

| Route | Outcome | Root cause / action |
|---|---|---|
| Veo 3.1 hero (vertex) | ✅ 8.0s b-roll, ~97s wall | **Projected $3.20 = billed $3.20** — pre-flight/billing parity proven live; per-model console lines from #90 working (`$0.26 @ replicate:minimax/hailuo-2.3-fast`) |
| replicate: hailuo-2.3-fast | ❌ 422 on submit | Model requires `first_frame_image`; handler sends `image` + non-schema `num_frames`/`fps` → [neurolink#1150](https://github.com/juspay/neurolink/pull/1150) |
| replicate: wan-2.7-i2v | ❌ `first_frame`/`first_clip` required | Same class → neurolink#1150 |
| wan-alpha (pre-existing alias) | ❌ 404 | `wechatcv/wan-alpha` removed from Replicate; NeuroLink's default `atonamy/wan-alpha` is t2v-only (the image was always silently ignored) |
| kling | ❌ twice | (a) Director passed a video-only name as NeuroLink's *text-shell* provider — kling/runway never worked live; fixed in [#95](https://github.com/juspay/director/pull/95). (b) `KlingVideoHandler` then requires a publicly accessible `imageUrl` (PiAPI rejects inline base64) — **superseded by the spike verdict below**: route Kling through Replicate instead |

**Spike verdict (2026-07-12, later the same day): the Kling `imageUrl` problem dissolves — route Kling through Replicate.** `kwaivgi/kling-v2.1` on Replicate takes `start_image` as a URI-format field and accepts inline data URIs, so no upload infrastructure is needed at all. Live spike results (local mirror of the upstream fixes, serial pacing):

- **Kling v2.1 generated a real 5.0s clip** (5.0 MB) from an inline data-URI `start_image` through the [neurolink#1150](https://github.com/juspay/neurolink/pull/1150) `imageInputKey` shape (~6.3 min generation).
- **Hailuo 2.3 Fast generated a real 5.9s clip** (776 KB) via `first_frame_image` (~3.8 min).
- Both initially failed at the *download* step — root-caused to a third upstream bug: NeuroLink's SSRF-pinned lookup ignores `options.all`, breaking every `safeDownload` on Node ≥20 (`autoSelectFamily`); fixed upstream in [neurolink#1157](https://github.com/juspay/neurolink/pull/1157) with a minimal undici repro (string-form → `Invalid IP address: undefined`; array-form → HTTP 200).
- Also learned: fresh Replicate accounts are throttled to 6 predictions/min, burst 1, until $5 lifetime spend; NeuroLink's runtime validation caps `resolution` at 720p/1080p, so hailuo's 768p must be left to the model default until the type/validator widen (noted on #1150).

Completion path unchanged but now fully de-risked: neurolink #1150 + #1157 merge/release → Director bumps NeuroLink, `REPLICATE_MODEL` aliases gain per-model `imageInputKey` (`hailuo-fast` → `first_frame_image`, and a new `kling-replicate` → `kwaivgi/kling-v2.1` + `start_image`), `wan-alpha` dropped. Proven live **in composition**: with both fixes mirrored locally, `minimax/hailuo-2.3-fast` generated and downloaded a real 5.9s clip end-to-end through `nl.generate` in 110.6s (`ok: true`).

Collateral fixed the same day: a failed phase was checkpointed `complete` (observe() swallowed the throw), so resume skipped it — [#94](https://github.com/juspay/director/pull/94). Net position: the draft tier's plumbing (routing, rates, projection) is proven; the actual cheap generation is blocked on neurolink#1150 merging + releasing, then one small Director follow-up.

## 2026-07-17 — Full-pipeline A/B: the AI judge said draft wins; the owner overrode it

The first end-to-end pipeline run on the activated draft tier (same Aether script and voiceover as the Veo baseline, `kling-replicate` route). Getting it to run found **four more Director bugs, all merged same-day**: draft-model aliases leaking verbatim to the Replicate API ([#102](https://github.com/juspay/director/pull/102)), dry-run checkpoints satisfying resume ([#103](https://github.com/juspay/director/pull/103)), no submit pacing/backoff — throttled accounts lose every segment to a 429 cascade ([#104](https://github.com/juspay/director/pull/104); the 429 body also corrected our throttle model: it keys on **credit < $5**, not lifetime spend), and a hardcoded 4s segment length that no enum-duration model accepts ([#105](https://github.com/juspay/director/pull/105): per-model `allowedLengths` + clamping). Also found: `wavespeedai/wan-2.1-i2v-480p` is **broken server-side** (opaque E002 on every submit that clears the throttle) — demote or drop it from the alias table. Upstream: NeuroLink's video retries fire ~1s apart ignoring `retry_after` ([neurolink#1189](https://github.com/juspay/neurolink/issues/1189)).

**The run**: 6×5s kling-v2.1 clips (clamped 4→5s), 32.26s finished 1080p video, gates + regression PASS, **$2.40 all-in** ($1.50 video — cost log matched Replicate billing to the cent; the budget gate correctly aborted two over-projection attempts first).

**The AI verdict**: the comparator picked the draft **over** the Veo baseline at 0.9 confidence (4.43 vs 3.86) — winning only the two resolution-driven dimensions (the baseline rendered at 720p), content/motion/storytelling scored tied.

**The human override (the finding that matters)**: on side-by-side review the owner rejected that verdict on every substance axis — product consistency broken, motion artifacts, shot-intent drift, overall look reads cheaper, and critically **the product's identity is gone: no logo, shallow understanding of what the product is**. Two conclusions replace the judge's one:

1. **Draft tier = iteration tool only** (blocking, timing, scene structure at ~1/6 the b-roll cost). It is not a hero substitute even when an AI judge says so; position it that way in every doc and help text.
2. **The comparator is resolution-swayed and product-blind.** Follow-up (W-COMP-FIDELITY): add product-fidelity dimensions — logo presence, product identity persistence across shots, brand-asset checks — and normalize inputs to matched resolution before scoring. Until then, treat comparator verdicts on cross-tier comparisons as advisory, not decisive.

### Research trail (Part IV)

Wave-3/4 structured results: session scratchpad `research3/*.json` (7 tier/critic lenses + 3 gap-fill); running log `research2/findings.md`. Artifact updated to v8 with §08 ("Part IV — the missing tiers"): hard-evidence leader board, end-to-end tier comparison, the critic's nine (Hedra, Tavus, Grok Imagine, Adobe Firefly/Topaz, Meta Vibes, Moonvalley, Viggle, Descript Underlord, Submagic-class).

## Evidence

- Research artifact (landscape + deep dive + verified bake-off): internal Claude artifact `director-deepdive-bakeoff`, July 2026.
- Bake-off raw outputs: per-system run dirs with command logs, verifier reports (ffprobe + frames), and finished videos.
- Deep-dive evidence trail: file:line citations per claim in the per-repo analyses (e.g. OpenMontage `video_compose.py:_pre_compose_validation`, ViMax `agents/best_image_selector.py` dead code, video-db `handler.py:109` session-init VideoDB coupling).

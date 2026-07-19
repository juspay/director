# Beat the field — gap analysis and battle plan (2026-07-18)

**Status:** proposed · **Owner:** core · **Origin:** the owner's 2026-07-18 challenge — *"this seems superficial: what is actually required to beat everybody on video quality, outcomes, cost, and speed?"* — answered by a 9-agent analysis pass over the full research corpus (roadmap Parts I–IV, bake-off evidence, both A/B videos frame-by-frame with vision, live web SOTA pull), then adversarially critiqued by two independent agents (completeness + evidence rigor), then the highest-stakes claims re-verified by hand the same day.

This supersedes nothing; it sits on top of [2026-07-10-competitive-research-roadmap.md](2026-07-10-competitive-research-roadmap.md) and converts its findings — plus new ones — into one scorecard and one prioritized execution list.

## 1 · The honest position — 15 battlegrounds

| # | Battleground | Verdict | Sev | Where we stand | Best in class |
|---|---|---|---|---|---|
| 1 | Raw video-gen quality (hero) | **lose** | crit | Sole-sourced to Veo 3.1 at $0.20–0.40/s; internal docs disagree on its rank (#3 vs #7 on AA within one week) | Contested — see §3; leaderboard must be re-pulled before any bet (B5) |
| 2 | Draft-tier model currency | **lose** | maj | Pinned to `kwaivgi/kling-v2.1` (`runner.ts:458`) — absent from AA's top-15; Kling has shipped 2.5 Turbo → 2.6 → 3.0 since | Kling 2.5 Turbo ~$0.07/s on fal at far higher rank |
| 3 | Product fidelity / brand presence | **lose** | crit | **Zero rendered logo/wordmark in either finished video's entire runtime**; ring identity drifts *within* the $14.40 hero cut (two-tone → plain band); draft mutates to gold. `image.ts:24` `DEFAULT_NEGATIVE` explicitly bans "logo, brand name, watermark" from every keyframe | Brand kits (logo/fonts/colors locked per campaign) are table stakes: Higgsfield, Creatify, Arcads, HeyGen — all composite the logo deterministically, independent of generation |
| 4 | Hook / CTA / ad structure | **lose** | crit | Zero hook/CTA references in `creative-director.ts`; both videos open on a **smartwatch** (competitor category) for 6–8s; **both videos' true final frames show the smartwatch under the CTA caption** — root cause found and proven, §2 | Arcads/Creatify enforce product-in-frame ≤2s and a dedicated end-card held 1.5–2s |
| 5 | Cost per finished video | **lose** | maj | No clean hero number: $14.40 is misattributed and six weeks stale (§3); draft $2.40 reconciles to the cent (23×$0.039 + $1.50) but fails fidelity | Market $0.04–0.40/s; finished ad clips ~$11 (Arcads) |
| 6 | Cost/state accounting integrity | **lose** | maj | Media calls ARE logged per-call post-#70 (verified: 23×image-gen + 1×video in the draft log; the "2 of 7 phases" figure came from the pre-#70 June log). Still unlogged: all agent/critic/scorer LLM calls (NeuroLink doesn't surface token usage) and the music phase (unverified). The legacy top-level `.pipeline-state/` is the June hero run's actual state (pre-#68) — must be archived into `output/`, not deleted | n/a — this undercuts our own "auditable spend" moat |
| 7 | Wall-clock per finished video | parity | min | 10.5–11 min for 32s — fastest of the three finished bake-off systems (OpenMontage 68m, ViMax 45m/incomplete) | HeyGen best-case 44s for 39s (marketing figure; other reviews 4–20+ min) |
| 8 | Iteration loop (fix ONE shot) | **lose** | maj | No `--regen-shot`; only an undocumented cache-file-deletion trick; yesterday's A/B took two full manual runs + a manual compare | Commercial tools expose per-shot regen; Creatify batches 20 hook variants <10 min (single-sourced) |
| 9 | Output formats / variants | **lose** | crit | `aspectRatio: '16:9'` hardcoded at 7 `runner.ts` call sites (566, 594, 645, 857, 871, 889, 920); 14 presets in `presets.ts` orphaned (only reachable via standalone `assemble()`) | 9:16 + 16:9 + 1:1 from one run is baseline for every paid-social product |
| 10 | Avatar quality | unmeasured | maj | Never benchmarked; HeyGen is load-bearing vendor **and** named competitor | Hedra ~$0.031–0.06/s, Tavus ~$0.013–0.017/s — never run on our profile |
| 11 | Captions / finish | **win** | min | Karaoke ASS captions independently judged "a solved problem" in the teardown (self-graded caveat: not a blind side-by-side) | MoneyPrinterTurbo adds Whisper script-correction; rendering-wise we meet the bar |
| 12 | Evaluation rigor | **lose** | crit | Quality gates score **narration text only** — `runner.ts:209–211` passes `{ script, response: script }`; the pipeline has never watched its own video. Fixed comparator (8a46cb7): zero pipeline call sites, validated n=1. VMAF/VBench gate has only ever returned sentinels (`vmaf=null`, `vbench=-1` — no CLI installed) | The standard is the owner's eye — which caught what the 0.9-confidence judge missed, twice (product mutation; and neither caught the CTA bug) |
| 13 | Reliability / success rate | unmeasured | maj | One completed full-pipeline A/B ever, requiring 4 same-day fixes (#102–#105); dead `wavespeedai/wan-2.1-i2v-480p` alias still in the table; neurolink#1189 open | n/a |
| 14 | Distribution / outcomes | **lose** | crit | `src/distribution/{hitl-gate,late-publisher,mux-hosting}.ts` fully built, **zero call sites in the runner**; zero CTR/CVR/ROAS data has ever existed | Creatify/Icon publish to Meta/TikTok in-product and close the measurement loop |
| 15 | Agent-native GTM | **lose** | maj | CLI-only; no URL→brief, no variant batching, no hosted MCP (deliberate W-DEC boundary, but the gap is real) | Higgsfield $500M ARR; hosted MCP servers became table stakes H1 2026 |

**Unmeasured (flying blind):** avatar bench, human-preference panel, conversion data, run success rate over N, real VMAF/VBench numbers, per-clip generation speed on our infra, agent-call costs, cross-video catalog consistency, determinism across identical runs, multi-aspect quality, Krea high-res rates, BytePlus India availability.

## 2 · Verified same-day: the CTA tail corruption (B1 ✓)

Re-verified by hand today, independently of the workflow's vision agent — frames committed under [`evidence/2026-07-18-cta-tail/`](evidence/2026-07-18-cta-tail/):

```
ffmpeg -sseof -3 -i <video> -vf fps=2 tail_%02d.jpg     # last 3s, 2fps
ffmpeg -sseof -0.5 -i <video> -frames:v 1 LAST.jpg      # true final region
```

- **Hero (`output/final_captioned.mp4`, 32.26s):** the ring CTA shot holds through ~31.3s (`hero_ring_cta_31s.jpg` — ring + "Know more. Pre-order today.") — then the final ~0.5s cuts back to the **opening smartwatch clip** with the same CTA caption (`hero_true_final_smartwatch.jpg`). The last thing a viewer sees in the $14.40 ad is a competitor-category product.
- **Draft (`output-abdraft/final_captioned.mp4`):** opens on a smartwatch (`draft_first_frame_smartwatch.jpg`) **and** its entire final second is a smartwatch with gibberish screen text under "Pre-order today." (`draft_true_final_smartwatch.jpg`). The ring never gets the final word.

**Root cause — found and proven the same day (`assembler.ts:87–92`):** `assemble()` targets the **voiceover** duration and feeds the b-roll with `-stream_loop -1` (infinite loop). Whenever the b-roll is shorter than the VO, the video wraps around to shot 0 — the smartwatch hook — for the overrun. Measured: hero b-roll 32.000s vs final 32.267s → 0.27s wrap; draft b-roll 30.200s vs VO 32.256s → **2.07s wrap** (the draft's entire CTA plays over replayed problem-shots). The 2s draft deficit is itself fallout from #105's duration clamp: 6×5s = 30.2s of segments against a 32.26s VO — segment planning never re-checks total b-roll ≥ VO duration. Crucially, **both shot plans are sound** (both declare a dramatic Aether hero shot as the closer — draft shot 7: "Hero shot of the Aether ring…") and the hero b-roll's own final frame IS the ring (verified) — the corruption is purely assembly. It was missed by the AI judge at 0.9 confidence *and* by human review. Fix is B2, now scoped to hours, not days.

Also verified by hand today:

- `src/generators/image.ts:24` — `DEFAULT_NEGATIVE` bans `logo, brand name, watermark` from every generated keyframe. The "no logo" failure is not model weakness; **we instruct it**. (Right call for generative text; wrong without a deterministic overlay to compensate — B3.)
- `src/agents/creative-director.ts:18` promises "Kling 3.0 / Runway Gen-4.5" while `runner.ts:458` routes `kwaivgi/kling-v2.1` — the prompt writes checks the router doesn't cash.
- Legacy top-level `.pipeline-state/` fossil present (stale cost log, `pipeline-state.json`, backups) — predates #68's per-run namespacing.
- `grep 'distribution\.' src/pipeline/runner.ts` → no matches; `getPreset` referenced only from `assembler.ts`.

## 3 · What the rigor critique corrected (and what it means)

1. **The July-17 A/B was confounded.** `output/`'s hero artifacts date to **2026-06-05** (gates 06-19) — six weeks and ~15 pipeline PRs older than the draft leg. The $14.40-vs-$2.40 comparison must not be cited externally. A clean same-commit, same-day re-run (B8) becomes the only citable baseline.
2. **Leaderboard volatility is itself a finding.** Three same-week internal snapshots of "the AA leaderboard" disagree (Veo #3 vs #7; a purported new #1, "Gemini Omni Flash", appears in zero prior internal docs and is unverified). No model swap gets committed on stale rank data — B5 gates B6 and any hero-tier change.
3. **Arithmetic:** draft run = **23** image-gen calls × $0.039 + $1.50 video = $2.397 ≈ $2.40 (not 22).
4. **Already fixed, don't re-fix:** per-output-dir state/cost namespacing landed in #68 (`stateDirFor`); only the pre-fix fossil cleanup remains (B7).
5. **Two "moats" demoted to assets:** the VMAF/VBench gate (has never measured a real video — sentinel passes only) and the fidelity comparator (validated n=1, unwired). They count as moats only after B4/B14 make them real.
6. **The whole matrix rides on n=1** — one 32s video pair. Confidence must be rebuilt run-by-run (B8, B13, B14).
7. **The hand-verification pass then corrected the workflow itself** (2026-07-18): the "cost log covers 2 of 7 phases / image calls unlogged" claim was measured against the pre-#70 June log — the July draft log has 23 per-image entries and reconciles to the cent; the CTA corruption is not "identical in both" videos (0.27s vs 2.07s wrap, same mechanism, §2); and the claimed `act1_hook` comment doesn't exist — `creative-director.ts` has *zero* hook/CTA references, which is worse. Even an adversarially-critiqued analysis needed a third pass against the working tree; that is exactly why B4 gates on a labeled calibration set.

The five durable moats stand: self-hosted/data-resident, provider-portable, enforced (not estimated) budgets, independent judging, deterministic resume + agent-drivable.

## 4 · Scorecard — what "beat everybody" means, per axis

| Metric | Today | Target | Measured by |
|---|---|---|---|
| Blind quality vs HeyGen/Creatify output | unmeasured (n=0) | ≥60% blind preference, n≥20 raters; product-identity-correct scored separately ≥95% | B12 panel |
| $/finished 30s video (single-attribution) | **B8 landed (§7): draft $2.35/30s at full fidelity PASS — beats target; hero $14.33/30s at fidelity PASS — misses ≤$5 on raw Veo economics ($0.40/s), route decision pending (Kling 3 Pro via fal ≈ $4/36s)** | hero ≤$5 **at fidelity-gate pass**; draft counts only if it passes fidelity too | B8 clean re-run, log ↔ billing to the cent |
| Wall-clock / finished video | 10.5–11 min (no avatar, 1 format) | ≤12 min **including** avatar + 3 aspect ratios | re-time after B2/B3/B4/B9 |
| Fidelity gate pass rate | gate wired ([#112](https://github.com/juspay/director/pull/112)) and blocking; B8: 2/2 completed legs pass, and it correctly vetoed both incomplete cuts first (§7) | ≥95% of ship-ready runs pass wired identity+logo+CTA gate (gate itself ≥8/10 on labeled set) | B4 + B2 checks |
| Iteration cost per shot | full re-run (only path) | ≤$0.50 and ≤90s per flagged shot | B10 measured vs baseline |
| Accounting completeness | 2/7 phases logged | 7/7 phases + agent calls; zero orphan state dirs | B7 audit |
| Formats per run | 1 (hardcoded) | 16:9 + 9:16 + 1:1 from one invocation | B9 ffprobe |
| Model-choice evidence freshness | 3 conflicting snapshots/week | dated first-party pull committed before any swap PR | B5 |

## 5 · Initiatives

### P0 — this week: fix what corrupts every output and what guards the moat

- **B1 · Re-verify the CTA tail corruption — ✓ DONE 2026-07-18** (§2; frames + commands committed). Remaining nicety: a programmatic last-N-seconds vs shot-plan diff, folded into B2's regression test.
- **B2 · Fix the CTA tail wrap-around — ✓ shipped same-day in [#109](https://github.com/juspay/director/pull/109)** (root cause §2): `assembleFinal` no longer loops the b-roll (freeze-frame `tpad stop_mode=clone` covers any VO overrun); `targetShotCount()` rounds UP so total b-roll covers the VO; and a third layer found during the fix — `normalizeShotPlan`'s end-truncation was silently dropping the **hero/CTA closer** when clamping over-length plans (the draft animated 6 of a cached 8-shot plan and lost its ring hero) — now preserves the last shot. Validated live: re-assembled draft is exactly 32.27s, tail freezes on the true closing shot. Still open from B2's scope: hook/end-card fields in the shot-plan schema (folded into B4's gate work).
- **B3 · Deterministic brand overlay — ✓ shipped same-day in [#110](https://github.com/juspay/director/pull/110)**: `src/rendering/brand-overlay.ts` — opt-in brand kit (`BRAND_LOGO`, `BRAND_LOGO_CORNER/WIDTH`, `BRAND_END_CARD`, `BRAND_END_CARD_SECONDS`), corner logo bug for the full runtime + full-frame end-card with fade over the tail, composited in `phaseAssembly` independent of the b-roll model. Validated live on the draft cut: the final frame is now a branded end-card — the first Director output that ends on the brand. `DEFAULT_NEGATIVE` kept as is, rationale documented in code.
- **B4 · Wire the fidelity comparator as a blocking pre-ship gate** — call `runVideoComparatorAgent` post-assembly beside the narration gates; calibrate on a 10-pair labeled set (≥8/10) before it blocks; add B2's deterministic CTA check beside it. *$3–6, days.*
- **B7 · Accounting integrity — ✓ shipped same-day in [#111](https://github.com/juspay/director/pull/111)**: avatar renders and paid music — the two genuinely unlogged billable phases — now log via `logMediaCost()` (duration-probed params; unknown-rate providers log at $0 by design so the *call* is always auditable, contract pinned by test). Legacy June state archived to `output/.pipeline-state-2026-06-legacy/` — a deliberately dead name, since `output/.pipeline-state/` would let a future default-output run resume off June checkpoints. Upstream token-usage ask formalized as [neurolink#1205](https://github.com/juspay/neurolink/issues/1205). `output-live*` dirs left untouched (historical outputs, nothing reads them).

### P1 — next: make the numbers real, then modern

- **B5 · Fresh dated leaderboard pull** — resolve #3-vs-#7; confirm or kill "Gemini Omni Flash" with one real API call; commit the dated snapshot. Gates every model swap. *$0–2, hours.*
- **B6 · Draft-tier currency** — repoint `kling-replicate` to the current Kling generation per B5; align `creative-director.ts`; staleness check vs AA model-family page. *$2–4, hours.*
- **B8 · Clean contemporaneous hero-vs-draft re-run** — same commit, same day, after B2–B7; both tiers must pass the new gates; publishes the first citable cost/quality baseline. *$5–8, days.* → **✓ landed 2026-07-19, both legs SHIP-READY — see §7.**
- **B9 · Multi-aspect output** — thread `aspectRatio` through the 7 call sites; wire `presets.ts` as a post-render re-encode pass → 16:9/9:16/1:1 from one run; ffprobe tests. *$0, days.*
- **B10 · Iteration loop** — `--regen-shot N` (expose the existing cache-probe path, documented) + `--variants N` batching so an A/B is one invocation. *$1–3, days.*
- **B11 · Avatar bench (W-P4-AVATAR-BENCH)** — HeyGen vs Hedra vs Tavus on our segment profile; concrete re-evaluation trigger for the HeyGen concentration risk. *$3–6, days; needs owner accounts.*
- **B12 · Blind human panel** — post-B1–B9 Director output vs matched HeyGen/Creatify output, n≥20, preference + identity-correct reported separately. *$5–8 + generation.*
- **B14 · Reliability tracking** — success/failure across next 10–20 runs (piggyback B8/B11/B12); remove dead `wan-2.1-i2v-480p` alias; land/workaround neurolink#1189. *$0.*

### P2 — expansions once P0/P1 hold

- **B13 · Determinism check** — identical script twice, diff identity/CTA/framing. *$3–5.*
- **B15 · Wire distribution** — connect the already-built `late-publisher`/`mux-hosting` behind the HITL gate; publish one low-stakes placement → first-ever CTR/CVR data. *Ad spend at owner's discretion.*
- **B16 · Catalog consistency** — 3–5 videos, same product, cross-video identity score via B4. *$4–8.*
- **B17 · Policy/IP/data-residency review** — China-hosted vendor map (Kling/Kuaishou, Seedance/BytePlus); make (not defer) the BytePlus India decision; platform-policy gate dimension. *$0.*
- **B18 · TCO incl. operator labor** — track hands-on time across N runs; publish a labor-inclusive $/video beside API spend. *$0.*
- **B19 · Thin hosted MCP server** — typed MCP tools wrapping existing CLI entry points, no new orchestration (respects W-DEC). *$0.*

## 6 · Sequencing

**The entire P0 wave shipped the same day this plan was written**: B1 ✓ (verified, frames committed), B2 ✓ [#109](https://github.com/juspay/director/pull/109), B3 ✓ [#110](https://github.com/juspay/director/pull/110), B7 ✓ [#111](https://github.com/juspay/director/pull/111). B4 lands after B2+B3 so the gate has something real to gate, and only blocks after its 10-pair calibration. B5 before B6 and before any hero-tier bet — no model swap on unverified rank data. Then **B8 is the capstone**: no cost or quality figure gets cited externally until it lands. B9/B10 are parallel-safe any time; B10 early — it directly answers yesterday's pain (two manual runs + manual compare). B11/B12/B14 are pure measurement; reuse B8's runs to avoid duplicate spend. P0 validation spend fits under ~$15 against $3.48 Replicate credit + Vertex; B6/B8 may need the credit topped up or routed via Vertex.

## 7 · B8 outcome (2026-07-19) — the gates earned their keep

Same brief, same script, same voiceover, same day, AETHER brand kit on both legs; hero = Veo on Vertex (9×4s), draft = Kling v2.1 on Replicate (7×5s); run as one `--variants hero,draft` invocation with per-leg budget caps and 16:9/9:16/1:1 outputs.

**Final baseline (ledger-corrected):**

| Leg | B-roll | True spend | Per 30s | Fidelity gate | Legacy score | Verdict |
|---|---|---|---|---|---|---|
| hero (Veo) | 36.0s / VO 32.26s | **$15.41** | $14.33 | PASS — identity 5/5, brand 5/5, tail 0.003, coverage 112% | 7.30/10 | **SHIP-READY** |
| draft (Kling v2.1) | 35.2s / VO 32.26s | **$2.53** | $2.35 | PASS — identity 5/5, brand 5/5, cta 5/5, tail 0.003 | 7.60/10 | **SHIP-READY** |

Comparator: hero wins at 0.9 confidence with a regression flag on draft — aligned with the July-17 human call, inverted from the July-17 machine call. Program total across both legs: $17.94.

**The run caught four real defect classes; all four were fixed the same day:**

1. **Prompt-length loss** — 4 of 16 segments died on NeuroLink's 500-char video-prompt limit while the doctor misclassified the rejection as transient (bare `500`/`503` in the message matched the status-code heuristic) and the freeze-pad masked a 26% frozen tail that the legacy scorer rated 8.65/10. → [#116](https://github.com/juspay/director/pull/116): clamp at `generate()`, classifier reorder, `brollCoverageOk` gate signal.
2. **Regen-blind pre-flight** — the budget projection priced all planned shots plus prior logged spend, so an honest re-roll could never pass its cap ($25.60 projected for ~$5 of new work). → [#117](https://github.com/juspay/director/pull/117): price only pending (un-cached) shots, all three b-roll modes.
3. **Judge without intent** — fidelity judge scored identity 1/5 on a run a 7-agent frame audit proved had **zero generative drift**: the plan deliberately opens on the villain smartwatch the ring replaces, and the judge read designed contrast as the product mutating. → [#118](https://github.com/juspay/director/pull/118): storyboard `[PRODUCT]`/`[CONTRAST]` intent lines in the judge prompt. Live calibration: identity 1/5 → 5/5 *and* the judge got sharper — script_alignment now names the exact missing shots, corroborating the coverage gate.
4. **Phantom billing on resume** — the phase-level cost log re-billed every cached segment on regen (hero ledger: 60s of Veo billed for 36s generated, $9.60 phantom). → [#119](https://github.com/juspay/director/pull/119): bill per clip at generation time, probing actual file duration.

**Scorecard readout:** the draft tier now clears the bar the plan set for hero — $2.35/30s at a full fidelity PASS — while hero's $14.33/30s is raw Veo economics ($0.40/s × 36s = $14.40 floor), not waste; the credible path to a ≤$5 hero is a route change (Kling 3 Pro via fal ≈ $0.112/s → ~$4.03/36s, pending B5/B6 discipline), not micro-optimization. The legacy scorer preferred the broken cut (8.15 frozen-tail vs 7.30 completed) — one more reason the verdict composes gates, not scores. Caveats that stand: n=1 brief; the judge's cta dimension remains tail-blind (deterministic tail check owns the ending, by design); and product identity still rests on generative consistency + critics — reference-conditioned generation remains the durable frontier for true drift, which this run happened not to exhibit.

## 8 · Kling 3 Pro third leg + the reference-conditioning frontier (2026-07-19)

Same brief/script/voiceover/keyframes as §7's hero, **only the hero-tier animator changed** — `kwaivgi/kling-v3-video` (Kling 3 Pro, $0.224/s) instead of Veo ($0.40/s) — to test the §7 hypothesis that a route change buys a cheaper hero without losing quality. The seeded run animated the same 9 cached keyframes (zero image spend) for **$8.15 true** (9 × 4.04s × $0.224/s).

**Fully-gated scorecard — the animator is the only variable:**

| Leg | Animator | Rate | videoScore† | Fidelity gate | tail | Verdict |
|---|---|---|---|---|---|---|
| hero | Veo | $0.40/s | 7.30 | PASS 5/5/5 | 0.003 | SHIP-READY |
| draft | Kling v2.1 | $0.05/s | 7.60 | PASS 5/5/5 | 0.003 | SHIP-READY |
| **kling-3** | **Kling 3 Pro** | **$0.224/s** | **7.70** | **PASS 5/5/5** | **0.0001** | NEEDS WORK\* |

**Kling 3 Pro matched both legs at full fidelity (5/5/5) and the cleanest tail (0.0001) at ~56% of Veo's per-second rate** ($8.15 video vs Veo's $14.40) — direct evidence for §7's "route change, not micro-optimization" path to a cheaper hero. Note this is a **quality tie at lower cost, not a quality win**: see the videoScore-noise finding (C) below. \*Its NEEDS WORK verdict was driven **solely** by a `biasDetection` reading of 0.7 vs a 0.8 threshold — the *same* ad script scored 0.8 (pass) on the hero and draft legs. That is judge quantization noise, not a defect (see finding B below); with it fixed the leg is SHIP-READY on every substantive gate.

†The dev-tier `videoScore` is **noise-dominated** — see finding C: these single-sample numbers cannot rank the three legs.

**Three findings surfaced while producing this leg — two fixed the same day, one is a measurement caveat:**

- **A · Brand kit silently dropped on resume** — re-running `--phases 6,7` with a new `BRAND_END_CARD` no-op'd (`[Assembly] Already complete, skipping`), shipping the un-branded cut; the tail check then failed against an end-card that was never composited. → [#123](https://github.com/juspay/director/pull/123): fingerprint the brand kit (path+size+mtime) in the pipeline state and re-run assembly + captions when it changes — b-roll stays cached so re-branding never re-pays for video.
- **B · A 1-point judge swing flips the verdict** — the LLM quality-gate scorers quantize to integer points (0.1 normalized); `biasDetection` flags ad copy structurally, so 0.7↔0.8 is sample-to-sample noise, yet it flipped SHIP-READY→NEEDS WORK on identical copy. → [#124](https://github.com/juspay/director/pull/124): a borderline band classifies a near-miss (within one point of threshold) as *inconclusive*, not *failed*, reusing the gate's existing noise semantics; default 0.1, `QUALITY_GATE_BORDERLINE_MARGIN=0` for strict mode.

- **C · The dev-tier `videoScore` cannot rank the legs** — re-scoring the *identical* kling-3 file 5× (gemini-2.5-flash, dev tier) returned **6.6, 7.5, 7.85, 8.9, 9.0** — a 2.4-point spread (mean ≈ 8.0, σ ≈ 1.0) on one unchanged video. So 7.30 / 7.60 / 7.70 across the three legs is a statistical tie; the legacy `videoScore` is a smoke test, not a ranking instrument, and the Production Verdict is right to compose deterministic gates rather than this score. *Follow-up (not yet done): rank on the `official` multi-judge tier and/or average N samples before any videoScore-based decision; consider making the dev-tier number advisory-only in the verdict.*

**Reference-conditioning frontier — first identity data (the §7 "durable frontier").** With live Replicate credit, `wan-video/wan-2.7-r2v` conditioned shots 2 & 8 on the canonical hero still (`.hero.png`) via the `BROLL_REFERENCE_MODE` plumbing ([#122](https://github.com/juspay/director/pull/122)); ~$1–2, measured `predict_time` 88.2s per 4s @ 1080p. The result is decisive on the hero shot: the **i2v baseline drifted the ring silver → gold** (it inherits the per-shot keyframe, which had itself drifted from the canonical hero), while **reference-conditioning locked the silver titanium finish** to the canonical still. Shot 2 shows the same pattern more subtly (i2v warms the palette; reference mode holds the cool tone). This is the exact product-identity failure mode §7 flagged as unaddressed by generative-consistency-plus-critics — reference-conditioning demonstrably closes it. (Replicate does not expose per-prediction $ via API; the exact wan-r2v $/s remains an owner dashboard read, so `MODEL_RATES` keeps its flagged upper bound.)

**Caveats:** the dev `videoScore` is both ending-sensitive (the same b-roll scored 6.1 un-branded vs 7.70 branded) *and* noise-dominated (finding C: 2.4-point spread on the identical file), so quality parity — not a win — is all it supports; the confident differentiators are cost (kling-3 at ~56% of Veo's rate) and fidelity (all three PASS 5/5/5). A fresh-generation repeat plus `official`-tier scoring is the confirming step before any hero-animator swap. The reference-conditioning pilot is n=2 shots, one model — decisive on shot 8's silver→gold drift, but a full-leg A/B is the next step.

## Method note

Produced by a 4-phase orchestrated analysis (5 corpus readers — docs, quantitative evidence, code, vision teardown of both finished videos, live web SOTA → gap synthesis → completeness + rigor critics → planning), 9 agents, ~768k tokens, 2026-07-18. Every code claim was then re-verified by hand in the working tree the same day (frame extractions, cost-log audits, per-claim greps); that pass proved B2's root cause (`assembler.ts:87–92` VO-targeting + `-stream_loop -1`, wrap measured at 0.27s hero / 2.07s draft) and corrected two workflow claims (§3.7). The critics' corrections (§3) are folded in above. Full structured outputs: session scratchpad `gap-matrix.json`.

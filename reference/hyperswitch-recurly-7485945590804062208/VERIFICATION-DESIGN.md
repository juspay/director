# Claim-verification design for the per-second A/B analysis

_2026-08-02. Decisions taken with Sachin after the field survey
(`VIDEO-SKILL-SURVEY.md`). Extends the method in `VIDEO-ANALYSIS-METHOD.md`._

## The problem being fixed

The pipeline has two trust mechanisms and each proves less than it appears to:

- The **ground-truth gate** (recover the 4 known cuts at ±0.15s or the run is
  discarded) proves a run *saw the video with correct timing*. It validates
  perception — it says nothing about whether any individual claim is true.
- The **2/3 corroboration vote** reduces noise (uncorrelated error). But the
  three runs share model, prompt, sampling and retiming, so their errors are
  correlated by construction. Proven failure: 2/2 runs agreed on a vignette
  that pixel measurement disproved; separate runs contradicted each other on
  white-balance direction and the vote couldn't settle it.

Between "the model saw correctly" and "the claim is true" there is currently
nothing. Every finding to date passed through that hole. Downstream cost is not
hypothetical: the failed relight pass and two of the three metric-chasing
regressions traced back to findings that would not have survived the layers
below.

## Decisions (recorded)

| Question | Decision |
|---|---|
| Burden of proof | **Split by measurability.** Measurable claims: the measurement decides, the model vote is irrelevant. Unmeasurable claims: default-REJECT unless eyewitness-supported. |
| Eyewitness channel | **Both channels, tie-break**: a claim needs ≥1 supporter and no refuter across (a) Claude reading cited full-res frames in-session and (b) a Gemini narrow-window high-resolution re-check. |
| Run budget | **Keep 3 Gemini runs** on top of the new layers. |
| Cost recovery | Content-hash upload dedup + Gemini context caching across the 3 runs; incremental per-run flush so a crash never re-spends completed work. |

## The layers

A finding ships only if it is **cited** AND **2/3-corroborated** AND
**measurement-confirmed** (if measurable) or **eyewitness-supported** (if not).

### Layer 0 — perception gate (unchanged)

Three independent runs per second, both complete 2×-retimed videos in every
request, fps=24, MEDIUM resolution; any run that misreports the known cuts in
its window is discarded.

### Layer 1 — citation firewall (structural, no model call)

Schema changes, enforced by `responseJsonSchema` plus a post-parse validator:

- Every difference claim carries `t` (original-timeline seconds, must fall
  inside the reported second) and a category from the fixed enum.
- `a_observable` / `b_observable` must describe **what is visible**, not what to
  do about it. Prescriptions ("add an anisotropic shader") live only in the
  advisory `fix` field and never count as evidence. This is the direct fix for
  findings that read plausible-but-generic: prescriptions are unfalsifiable by
  construction.
- Claims in measurable categories must carry a `prediction` (below); a
  measurable-category claim without one is rejected before the vote.

Modelled on watch-skill's `_sanitize_timestamps` and watch-video's
`validate_report.py`: hallucinated or unfalsifiable citations become
structurally impossible, not merely discouraged.

### Layer 2 — measurement decides (deterministic, local)

The claim must *predict what a measurement will show*; the veto checks the
prediction against frames extracted from the ORIGINAL-timebase videos at the
cited time:

| `prediction.metric` | Measures | Settles claims about |
|---|---|---|
| `vignette` | corner-vs-centre luma ratio, 5-region crop | vignette / edge falloff |
| `color_cast` | per-channel means, A vs B delta | white balance, colour cast |
| `luma_curve` | luma percentiles (p1/p5/p50/p95/p99) | contrast, exposure, crush/clip |
| `motion` | mean abs frame delta at t..t+1 frame | motion amount, static vs moving |
| `region_sharpness` | Laplacian variance, region-scoped | DOF, focus placement |

Rules:

- For these categories the measurement decides, period. Agreement between runs
  does not rescue a claim the measurement refutes.
- Every veto is logged → a per-category false-positive rate for the model
  accumulates over time.
- **A falsifier earns veto power only after being validated against a known
  case** (the disproven vignette, the measured cool/warm white-balance split,
  the shadow-percentile gap), exactly as the analyser itself was
  ground-truth-gated. The edge-clipping audit that scored 0 while a card sat
  fully off-frame is the cautionary tale: measurements can be wrong too.
- Design principle, learned three times over: **measurements falsify claims;
  they never become objectives.** No falsifier output is ever optimized toward.

### Layer 3 — dual eyewitness for the unmeasurable (targeted)

Semantic claims (element present/absent, layout, typography, staging) cannot be
settled by a scalar. Default-REJECT unless supported, with two decorrelated
channels:

- **Channel A — Claude reads the cited frames.** Full-resolution stills of only
  the cited frames from both videos, verified in the driving session via the
  native Read tool. Different model family, different modality path (full-res
  stills vs 24fps video stream), different task framing (verify one claim vs
  describe everything), zero marginal API cost. The field's weak *primary*
  mechanism repurposed as a strong *verifier*.
- **Channel B — Gemini narrow-window re-check.** A short clip (±0.75s) around
  the cited time from both videos, per-part HIGH media resolution, asked only
  "is this specific claim true → {verdict, certainty}". Windowing was rejected
  for *discovery* because 1.4s cannot distinguish a cut from a fast move; for
  *verifying a named claim at a named time* the context objection doesn't
  apply.

Tie-break: **≥1 supporter and no refuter.** A refute from either channel kills
the claim; abstentions don't count as support.

## Cost notes

- The dominant cost is re-tokenizing two complete videos 3× per second.
  Content-hash upload dedup plus a shared context cache makes the runs reuse
  one set of video tokens (video-research-mcp pattern, including its
  self-suppression after a "too few tokens" cache rejection).
- Layers 1–2 are free (regex + local ffmpeg). Layer 3 cost is bounded by the
  count of surviving unmeasurable claims, not by video length.
- Historically the largest real cost was build passes spent on wrong findings.
  A verification stack that kills one bad finding per pass pays for itself.

## Non-goals

- This does not retroactively fix the known open build problems (gobo never
  reading, missing secondary-detail layer, shadow tone-curve hole). Order of
  operations: verification layers → re-analysis → build against findings that
  can finally be trusted.
- No SSIM/PSNR whole-frame scoring. Global similarity metrics reward blur and
  were already the source of three metric-chasing regressions; measurement here
  stays claim-scoped.

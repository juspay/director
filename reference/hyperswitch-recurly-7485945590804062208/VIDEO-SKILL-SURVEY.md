# Video-understanding skills for coding agents — a code-level survey

_2026-08-02. Twelve GitHub projects torn down at code level (actual scripts read,
not READMEs), motivated by the question: does the field know something our
analysis pipeline doesn't?_

## Headline findings

1. **9 of 12 projects never call a video model.** The dominant architecture is:
   ffmpeg extracts sparse JPEGs (typically ≤2fps, ≤100 frames, 512px wide) and
   the host LLM session `Read`s them as ordinary images. That includes the three
   most-starred projects — video-use (18.3k★), claude-video (13.4k★),
   OpenMontage (44.6k★). Stars measure packaging, not perception.
2. **Only one project uses native video ingestion** (video-research-mcp →
   Gemini Files API) — the same architecture as this pipeline.
3. **Nobody does two-video A/B comparison.** Every project is a single-video
   describe/QC/search tool. Frame-accurate reference-vs-render comparison has no
   prior art in this field.
4. **Nobody validates their sampling against ground truth.** Every "scene
   detection" is an unvalidated heuristic threshold trusted at face value. Our
   gate — the analyser must recover 4 known cuts at ±0.15s or the run is
   discarded — has no equivalent anywhere in the surveyed field.
5. **Most "verification" is prose, not code.** video-use's advertised
   "self-eval that detects visual jumps and audio pops" is a natural-language
   checklist in SKILL.md; a grep of every `.py` file finds zero detection code,
   and its "3 retry attempts" cap is an unenforced instruction. The exceptions
   with real verification code are watch-skill, video-expert-analyzer-vnext,
   watch-video, and (partially) OpenMontage — detailed below.

## The twelve, at a glance

| Project | ★ | Pixels reach a model how | Verification in code |
|---|---|---|---|
| [browser-use/video-use](https://github.com/browser-use/video-use) | 18.3k | one filmstrip+waveform PNG, host LLM reads | none (prose checklist; 1 ffprobe duration check) |
| [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | 44.6k | frame paths returned for host LLM to fill | partial: ffprobe heuristics, Whisper-vs-script diff, 2-round cap |
| [bradautomates/claude-video](https://github.com/bradautomates/claude-video) | 13.4k | JPEGs ≤2fps, host LLM reads | none |
| [jordanrendric/claude-video-vision](https://github.com/jordanrendric/claude-video-vision) | 1.1k | MCP image blocks; Gemini used for **audio only** (deliberately downgraded from video to save tokens, CHANGELOG v1.1.0) | none on content |
| [taoufik123-collab/claude-watch](https://github.com/taoufik123-collab/claude-watch) | 542 | JPEGs, one per detected shot, host LLM reads | none |
| [oxbshw/watch-skill](https://github.com/oxbshw/watch-skill) | 250 | JPEGs to any of 4 vision APIs (stills only, even on Gemini) | **best in field** — see below |
| [ALBEDO-TABAI/video-expert-analyzer-vnext](https://github.com/ALBEDO-TABAI/video-expert-analyzer-vnext) | 25 | base64 JPEGs to OpenAI/Anthropic APIs | sparse re-scoring audit; crash-safe flushing |
| [Galbaz1/video-research-mcp](https://github.com/Galbaz1/video-research-mcp) | 22 | **native video → Gemini Files API** (only one) | self-consistency gates only |
| [twelvelabs-io/twelve-labs-claude-code-plugin](https://github.com/twelvelabs-io/twelve-labs-claude-code-plugin) | 20 | black-box SaaS (Marengo/Pegasus, server-side) | none |
| [bsisduck/video-analyzer-skill](https://github.com/bsisduck/video-analyzer-skill) | 20 | montage-grid JPEGs, host LLM reads, parallel subagents | pre-dispatch sanity check only |
| [haithamelmengad/popcorn](https://github.com/haithamelmengad/popcorn) | — | MCP image blocks, all local | none |
| [TomGranot/watch-video](https://github.com/TomGranot/watch-video) | 5 | contact sheets, host LLM reads; **zero API calls anywhere** | evidence-provenance validator |

## The verification designs worth studying

### watch-skill — citations made structurally impossible to fake

- `_sanitize_timestamps` regex-validates every timestamp the model cites in
  prose against the actual indexed evidence list (±2s) and replaces unsupported
  ones with "[see evidence]". Hallucinated citations are prevented by
  construction, not discouraged by prompt.
- **Eyewitness veto**: the model is re-shown only the exact frames it cited and
  must return `{supported, certainty}`; a rejection overrides retrieval
  strength.
- THE LOOP (capture→critique→diff→re-capture): greedy monotonic phash alignment
  (Hamming threshold 22 bits) matches frames between two independently-timed
  recordings; each issue is classified fixed/unchanged/new via text similarity
  (≥0.55) + timestamp proximity (≤10s); hard stop when score fails to improve
  for 2 consecutive iterations.
- Documented shipped bug worth remembering: phash is grayscale and **blind to
  pure hue changes** — a button turning red was invisible to their dedup. Fixed
  by exempting pinned cue frames from dedup.
- Pre-flight cost guard: tokens ≈ (w×h)/750, refuses calls above a USD ceiling.

### video-expert-analyzer-vnext — audit and crash-safety

- **Sparse re-scoring audit**: after scoring, 3 evenly-spaced scenes are
  silently re-derived from scratch and diffed — classification must match and
  summed score delta must stay ≤4.0, else the run fails validation and cannot
  finalize.
- **Crash-safe incremental flushing**: every result is written under a lock the
  moment its API call returns; a crash loses only in-flight work.
- **Anti-cheating gate**: greps worker summaries for phrases like "PIL-based
  frame feature analysis" — a literal guard against an agent substituting cheap
  pixel statistics for the vision call it was asked to make.
- Dual-detector fusion: PySceneDetect ContentDetector + AdaptiveDetector run
  independently, boundaries pooled and merged within a tolerance window.

### TomGranot/watch-video — provenance as schema

- Every claim must declare `source_type` (observed/spoken/inferred) and
  `support_status` (supported/conflicted/not_found).
- `validate_report.py` checks every cited evidence path resolves against the
  actual frame manifest; malformed or unsupported claims fail structurally.
- "Conflicted" is preserved, never silently arbitrated.
- Honest limit, stated in their own docs: it catches unsupported claims, not
  wrong-but-well-formed ones.

### OpenMontage — deterministic gates on its own renders

- Black-frame detection by raw PNG file size (<2000 bytes ≈ solid black) as a
  zero-cost triage before any model attention.
- Whisper-transcribes the rendered narration and token-diffs it against the
  script — catches TTS reading punctuation aloud ("dot", "comma") via a
  hard-coded blocklist. A production bug turned into a permanent regression
  check.
- Hard 2-revision-round cap before "pass with warnings" — an explicit
  anti-infinite-loop policy.
- Confirmed by full-repo grep: **zero pixel-diff/SSIM/PSNR code anywhere**, even
  here, the closest thing the field has to a compare-against-something tool.

## Smaller tricks worth keeping

- Burn timestamps into pixels: `drawtext=text='%{pts\:hms}'` makes time
  model-visible with no side-channel mapping (bsisduck).
- Montage grids via `tile=4x4` pack 15–16 frames per image — claimed 60–70%
  token savings for frame-based passes (bsisduck).
- Dedup against the last **kept** frame, not the previous candidate, so
  A,A,B,B,A collapses to A,B,A (claude-video, unit-tested).
- `select='eq(n,0)+gt(scene,T)'` force-includes frame 0 — the scene filter only
  fires on changes, so the opening shot is otherwise lost (claude-watch).
- Recover exact timestamps from a `-vsync vfr` extraction by piping
  `metadata=mode=print:file=-` through the same ffmpeg call and parsing
  `pts_time:` (claude-watch).
- Content-hash upload dedup with per-hash lock + Gemini context-cache prewarm
  with self-suppression after a "too few tokens" rejection (video-research-mcp).
- Schema-enforced substance: Pydantic `min_length`/`min_items` on the output
  contract forces ≥3 key points with ≥10-char descriptions — anti-laziness at
  the contract level, not the prompt level (video-research-mcp).
- Scene-frames within 0.15s of a uniform-sampled frame are dropped before
  contact-sheet packing (watch-video).

## What the field does NOT solve (confirmed gaps)

1. Frame-accurate reference-vs-render A/B comparison — no prior art at all.
2. Decorrelated corroboration — every re-check in the field re-runs the same
   model via the same mechanism, which cannot catch correlated hallucination.
3. Deterministic measurement integrated into the verdict — ffmpeg passes are
   used to decide *where to look*, never as an independent veto on a specific
   model claim.
4. Resumable multi-run corroboration under native-video ingestion.
5. Any pixel-level fidelity metric (SSIM/PSNR/colour-delta) inside an agentic
   video pipeline.

Gaps 2 and 3 are exactly the weaknesses this pipeline has already demonstrated
(2/2 cross-run agreement on a nonexistent vignette). The response is specified
in `VERIFICATION-DESIGN.md`.

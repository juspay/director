# Scoring Methodology

Comprehensive guide to the scoring and iteration strategy used across the Tara
video production pipeline.

## Why 3-Run Averaging

Gemini (gemini-2.5-pro) exhibits scoring variance of +/-0.8 to 1.0 points when
re-scoring the exact same video with the exact same prompt. A single run cannot
be trusted as a stable signal.

Protocol:
1. Score every artifact (video, script, audio) a minimum of 3 times.
2. Average the overall scores and each dimension/criterion independently.
3. Record the variance (max - min) for each run set.
4. Only act on the averaged score when making iteration decisions.

This smooths the noise and prevents chasing phantom regressions.

## Target Thresholds

| Artifact   | Rubric                | Target Score | Lock Criteria                         |
|------------|-----------------------|-------------|---------------------------------------|
| Video      | 7-dimension weighted  | 9.0 / 10    | 3-run average >= 9.0                  |
| Script     | 11-criterion          | 9.0 / 10    | 3-run average >= 9.0, no criterion <7 |
| Voiceover  | 8-criterion acoustic  | 8.5 / 10    | Deterministic; single pass sufficient |

The script threshold is intentionally high (9.0) because the script is the
foundation; weak scripts produce weak videos regardless of visual polish.

## Iteration Strategy

The core loop:

```
score --> identify weakest dimension --> targeted fix --> re-score
```

Rules:
1. After each scoring round, identify the single lowest-scoring dimension.
2. Make a targeted fix addressing ONLY that dimension.
3. Re-score. Verify the targeted dimension improved.
4. Check that other dimensions did not regress (see regression detection below).
5. Repeat until the overall average meets the target.

Do not attempt to fix multiple dimensions simultaneously. Focused, single-axis
improvements produce clearer signal and avoid regressions.

## Regression Detection

**Lesson from v9**: Over a series of iterations in v9, the overall video score
dropped from 8.83 to 7.33. Each individual change seemed reasonable in
isolation, but cumulative side effects degraded quality dimensions that were not
being monitored.

Prevention protocol:
1. After every re-score, compare ALL dimension scores against the previous
   iteration, not just the targeted one.
2. If any non-targeted dimension drops by more than 0.5 points (averaged), flag
   it as a regression.
3. If a regression is flagged, revert the last change and try a different
   approach.
4. Maintain a score history log (JSON) across iterations for trend analysis.

## Reference/Compare Modes (from v2)

The `reference_comparator.py` script (originating from v2) supports three
modes that calibrate scoring against industry examples:

### reference mode
Analyze professional reference videos (e.g., Zelios Supahub, ElevenLabs) to
extract visual benchmarks: color palettes, motion techniques, transition
styles, pacing patterns. The output becomes a benchmark document.

### score mode
Score the Tara video against the rubric. If reference benchmarks exist, they
are injected into the scoring prompt so Gemini calibrates its ratings against
known professional quality.

### compare mode
Side-by-side gap analysis: load reference videos and the Tara video
simultaneously, ask Gemini to rate all three on the same dimensions, and produce
a prioritized improvement list ranked by impact/effort.

This three-mode approach ensures scoring is not abstract but grounded in
concrete professional examples.

## Content-Specific Rubric Approach (from v8)

The v8 scorer introduced content-specific rubric design. Instead of generic
motion-graphics criteria, the rubric is tailored to the actual product and
content:

- Real team member names are listed in the prompt so Gemini can verify authenticity.
- Real repository names are listed so Gemini can check for generic placeholders.
- The Slack UI target (#1a1d21 dark mode) is specified so color fidelity is scored.
- Scene structure with timestamps is provided so Gemini knows what to look for where.

This yields far more actionable feedback than a generic "rate the video quality"
prompt.

## Extended Reasoning: thinking_budget=4096

All scoring calls use `thinking_budget=4096` in the Gemini ThinkingConfig. This
gives the model extended internal reasoning before producing its response,
resulting in:
- More nuanced per-dimension scoring.
- Fewer hallucinated scores (the model "double-checks" its weighted calculation).
- More specific, actionable improvement suggestions.

The trade-off is higher latency and token cost per call. With 3-run averaging,
each scoring iteration costs roughly 3x the tokens of a single call.

## JSON + Markdown Dual Output

Every scoring run produces two output files:

### JSON (machine consumption)
```json
{
  "iteration": 3,
  "video_file": "tara_v8_draft_v2.mp4",
  "num_runs": 3,
  "overall_scores": [8.92, 9.15, 8.88],
  "average_overall": 8.98,
  "variance": 0.27,
  "dimension_averages": {
    "content_authenticity": 9.2,
    "visual_polish": 8.8,
    ...
  },
  "target": 9.0,
  "target_reached": false
}
```

Used for:
- Automated regression detection (compare across iterations).
- Dashboard/trend visualization.
- CI/CD gating (proceed to next pipeline stage only if target is met).

### Markdown (human consumption)
Contains the full Gemini response text for all 3 runs, including:
- Per-dimension scores with justifications.
- Top improvements ranked by impact.
- Deal-breakers.
- What works well (do not change).

Used for:
- Human review of qualitative feedback.
- Extracting specific improvement tasks.
- Documenting the iteration history.

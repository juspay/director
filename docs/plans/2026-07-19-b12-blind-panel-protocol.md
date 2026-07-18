# B12 · Blind panel protocol — kit built, owner steps remaining (2026-07-19)

Scorecard targets (battle plan §4): **≥60% blind preference** vs a HeyGen/Creatify cut at
**n≥20 raters**; **product-identity-correct scored separately, target ≥95%**.

## What exists now

The complete panel kit lives outside the repo (videos don't belong in git) at
`~/Developer/temp/director-artifacts/panel-kit/`:

- `stimuli/S2.mp4` — Director hero leg (B8 baseline, Veo, SHIP-READY, $14.33/30s true)
- `stimuli/S4.mp4` — Director draft leg (B8 baseline, Kling v2.1, SHIP-READY, $2.35/30s true)
- `S1`/`S3` — reserved competitor slots (HeyGen; Creatify or the kling-3 leg)
- `README.md` — full per-rater procedure (random viewing order per rater, rank-then-answer,
  one replay allowed before the yes/no questions, no project-affiliated raters)
- `response-sheet.csv` — one row per rater × stimulus: preference rank, product-category
  identification, same-object-throughout, brand recall, face validity
- `KEY-do-not-open-before-scoring.md` — sealed stimulus↔source mapping

## Why the identity questions are separate from preference

The July-17 A/B taught this: the AI judge preferred the cheap cut until the owner's review
surfaced product-identity failure — preference and identity are different failure axes and
must not be averaged. The panel reports them independently, matching how the fidelity gate
splits authority in the pipeline.

## Owner-gated steps (cannot be done by the pipeline)

1. Generate the competitor cuts with the same brief (script: `assets/script.txt`, AETHER
   titanium smart ring, ~32s, 16:9) on your HeyGen/Creatify accounts → `S1.mp4`/`S3.mp4`.
   Export what a paying customer actually gets — don't hand-polish.
2. Recruit n≥20 raters (mixed AI-video familiarity, none project-affiliated).
3. Run per the kit README; return the filled `response-sheet.csv`.

Analysis (pairwise preference table + per-stimulus identity rates) is scripted work the
pipeline session can do the moment the CSV comes back.

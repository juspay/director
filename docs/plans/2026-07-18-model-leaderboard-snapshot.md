# Model leaderboard snapshot — 2026-07-18

**Status:** verified · **Owner:** core · **Origin:** battle-plan B5 (#108) — the standing rule that no model bet ships on stale rank data. Produced by a delegated research session against first-party sources, then the decision-critical Replicate defaults re-verified live from the models API the same day (addendum at the end). Retrieval date for everything below: **2026-07-18**.

## Why this document exists

Three internal snapshots taken within one week (2026-07-10 roadmap, 2026-07-12 landscape doc, 2026-07-18 gap matrix) disagreed on the #1 video model and on Veo 3.1's rank (#3 vs #7). Resolution: **#7 / Elo 1088 (image-to-video, with-audio board) is current; the "#3" read was a real but stale snapshot** predating Gemini Omni Flash, Seedance 2.0, and Wan 2.7 entering the arena. Leaderboard volatility is itself the finding — re-pull before every model commitment.

## Artificial Analysis video arena (retrieved 2026-07-18, "With Audio" view)

Source: artificialanalysis.ai/video/leaderboard/{text-to-video,image-to-video}.

### Image-to-video — the board that prices Director's b-roll

| Rank | Model | Creator | Elo |
|---|---|---|---|
| 1 | Gemini Omni Flash | Google | 1,203 (1,374 no-audio) |
| 2 | Dreamina Seedance 2.0 720p | ByteDance Seed | 1,197 |
| 3 | grok-imagine-video-1.5-preview | xAI | 1,117 |
| 4 | HappyHorse-1.1 | Alibaba-ATH | 1,111 |
| 5 | Wan 2.7 | Alibaba | 1,098 |
| 7 | **Veo 3.1 (our hero tier)** | Google | 1,088 |
| 10 | Veo 3.1 Fast | Google | 1,079 |
| 12 | Kling 3.0 1080p (Pro) | KlingAI | 1,073 |
| 18 | Kling 2.6 Pro | KlingAI | 1,006 |
| — | kwaivgi/kling-v2.1 (our draft) | KlingAI | not on the board |
| — | Hailuo (any) | MiniMax | not on the board |

Text-to-video top 3: Gemini Omni Flash 1,240 · Seedance 2.0 1,225 · Wan2.7-260612 1,160; Veo 3.1 sits #11 (1,094); LTX-2.x occupies #21-25 (974→921).

## "Gemini Omni Flash": CONFIRMED real

Cross-checked across five first-party Google surfaces (blog.google announcement at I/O 2026, DeepMind model card published 2026-05-19, ai.google.dev docs + pricing, Vertex/GEAP model garden "preview"). Model id **`gemini-omni-flash-preview`**, API open since 2026-06-30, video output billed at 5,792 tokens/second of 720p ≈ **$0.10/s**. It is Gemini-API/Vertex-preview only — **not reachable via Replicate**, so it does not change the draft-tier routing below; it IS the strongest candidate for a future hero-tier experiment (leaderboard #1 on both boards at ~¼ of Veo 3.1's $0.40/s). A rumored "Gemini Omni Pro" has no first-party existence — treat as speculation.

## Kling on Replicate (kwaivgi/*), live pricing + schemas

| Slug | Image field | Duration | Billed via our plumbing | Elo (i2v) |
|---|---|---|---|---|
| `kling-v2.1` (current draft) | `start_image` | enum [5, 10] | $0.05/s | off-board |
| `kling-v2.5-turbo-pro` | `start_image` | enum [5, 10] | $0.07/s | not ranked distinctly |
| `kling-v2.6` | `start_image` | enum [5, 10] | **$0.14/s** (see addendum) | ~1,006 |
| `kling-v3-video` | `start_image` | integer 3–15 | **$0.224/s** (see addendum) | ~1,073 |
| `kling-v3-omni-video` | `start_image` (+refs) | integer 3–15 | $0.224-0.28/s | ~1,062 |

Secondary check (fal.ai): Kling 2.6 Pro pricing matches Replicate exactly; Kling 3.0 Pro no-audio runs **$0.112/s on fal vs $0.224/s on Replicate** — Replicate appears to charge elements-tier rates for the plain model. If Kling-3-class quality becomes a volume path, adding fal.ai as a provider halves that cost — parked as a follow-up, not done.

## Verification addendum (2026-07-18, same-day): the defaults that change the bill

Input-schema defaults pulled from Replicate's models API directly (NeuroLink's handler sends only the mapped fields — a model's defaults apply for everything else):

- `kling-v2.6`: **`generate_audio` defaults `true`** → through our plumbing it bills at the with-audio **$0.14/s**, not the $0.07/s headline. 2.8× v2.1 for Elo ~1,006.
- `kling-v3-video`: **`mode` defaults `"pro"`, `generate_audio` defaults `false`** → bills at **$0.224/s** exactly as tabled. Duration integer 3–15, no enum.

## Decision (B6, shipped with this doc)

- **`kling-3` alias added** → `kwaivgi/kling-v3-video` (`start_image`, no duration enum): the highest-Elo Kling reachable through the existing account, at an honestly-priced $0.224/s in `MODEL_RATES`. This is the *quality* route — and it makes the creative-director prompt's long-standing "Kling 3.0" claim actually true when routed.
- **`kling-replicate` (v2.1, $0.05/s) stays the cheap iteration draft.** The draft tier's job is blocking/timing/structure at minimum cost (owner ruling, 2026-07-17); a 4.48× price jump contradicts the tier's purpose.
- **`kling-v2.6` deliberately not added**: audio-priced at $0.14/s through our plumbing for ~1,006 Elo — dominated by v2.1 on price and by v3 on quality. Recorded here so the decision isn't re-litigated from the headline price.
- Rates added to `MODEL_RATES` only where verified: `kwaivgi/kling-v2.1` $0.05/s, `kwaivgi/kling-v3-video` $0.224/s.

## Standing rule

Every future hero/draft model decision cites a dated, URL'd pull like this one, re-pulled immediately before the commitment. Three same-week snapshots disagreeing is the proof of why.

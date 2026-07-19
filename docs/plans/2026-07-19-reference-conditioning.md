# Reference-conditioned generation — verified routes and pilot plan (2026-07-19)

Product identity today is *generative consistency*: one canonical hero still → per-shot
keyframes by image-to-image derivation (critic-vetted) → image-to-video animation. B8
proved the gates now **catch** identity failure reliably; nothing yet **prevents** it —
the video model never sees the product reference. Reference-conditioning moves identity
into the video model itself: the model takes reference image(s) of the subject and is
trained to preserve that subject across the clip.

All routes below were verified live on 2026-07-19 against the Replicate API
(input schemas pulled from `latest_version.openapi_schema`) and official Google docs.
**No Replicate per-second price below is API-verified** (the pricing tab is JS-rendered);
figures are third-party estimates — the pilot protocol therefore starts with a $1-class
test call per model and reads the actual charged amount (per-clip billing lands in the
ledger since [#119](https://github.com/juspay/director/pull/119)).

## Verified route table

| Route | Reference input | Constraints | Price (flagged) | Wiring |
|---|---|---|---|---|
| **`wan-video/wan-2.7-r2v`** (Replicate) | `reference_images` array — described for "character/**object**" identity | 2–10s (2–5s recommended), 720p/1080p, 16:9/9:16/1:1/4:3/3:4 | est. $0.056–$0.10/s (unverified) | LOW — existing NeuroLink Replicate path, new array param |
| **`google/veo-3.1` R2V** (Vertex native or Replicate wrapper) | `referenceImages`/`reference_images`, 1–3 images, `referenceType: "asset"` | **reference mode locks 16:9 + 8s exactly** (documented) | est. $0.20–$0.40/s class (unverified for R2V mode) | LOW via Replicate wrapper; Vertex-native needs NeuroLink multi-image support |
| **`bytedance/seedance-2.0`** / `-fast` (Replicate) | `reference_images` up to **9**, in-prompt `[Image1]` tags; exclusive with i2v `image` | int durations or adaptive, up to 4K (4K+refs unconfirmed), any aspect incl. adaptive | est. $0.045–$0.30/s — **6× spread, least certain** | LOW — same pattern |
| `kwaivgi/kling-v3-omni-video` (Replicate) | `reference_images` up to 7, `<<<image_1>>>` tags; `multi_prompt` up to 6 shots/call | 3–15s, standard/pro/4K | est. $0.112–$0.168/s (unverified) | LOW — add alongside once array plumbing exists |
| Gemini Omni Flash (`gemini-omni-flash-preview`) | up to 7 ref images + 3 clips, `<IMAGE_REF_N>` tags, `task: "reference_to_video"` | **720p only**, 3–10s, 16:9/9:16 | **$0.10/s — officially documented (verified)** | MEDIUM-HIGH — new Interactions API surface, not the NeuroLink video call shape |

Checked and **ruled out for now**: Vidu q3 (no reference param on Replicate — i2v only),
Runway Gen-4.5 on Replicate (single `image` only; References mode is Runway-API-only),
Pika Ingredients (fal.ai only — no account), `minimax/video-01` `subject_reference`
(legacy S2V-01 backbone; the current hailuo-2.3 lineup dropped the param),
`xai/grok-imagine-r2v` (has 1–7 refs but self-describes as style/content refs, not
identity lock — fallback only), kling motion-control (needs a driving video per shot —
motion transfer, not general identity).

**License caveat (applies to all API-only Replicate models):** none expose license text
via the API; only Replicate's platform ToS visibly governs. Manually check each vendor's
terms before using outputs in paid campaigns.

## Pilot plan (in order; each step gates the next)

1. **Rate verification** — one ~5s generation per candidate (wan-2.7-r2v, seedance-2.0-fast,
   kling-v3-omni), read the actual charge from the Replicate dashboard against the ledger
   entry. Kills the 6× price uncertainty for ~$1–2 total. **Blocked today: Replicate credit
   < $5 (hard-throttle threshold, same blocker as the kling-3 hero leg) — needs a top-up first.**
2. **Identity pilot** — same AETHER brief, same shot plan: generate shots 2 and 8 (the macro
   product shot and the hero closer) on each candidate with `reference_images: [hero.png]`
   and the shot prompt, then run the frame-audit + fidelity judge against them. Measures
   identity strength where it matters most, ~$3–5.
3. **Array plumbing** — extend `src/generators/index.ts`: `options.referenceImages?: string[]`
   alongside `inputImage`, per-model input key in the `REPLICATE_MODEL` table (some models
   also need in-prompt tags — compose in `buildAnimationPrompt`, respecting the 500-char clamp).
   Ship behind a `BROLL_REFERENCE_MODE` env flag; hero tier only.
4. **Full-leg A/B** — `--variants` run: current keyframe-chain hero vs reference-conditioned
   hero, gates + comparator decide. Only after this does any route earn a default.

## Results (2026-07-19)

Credit landed; steps 1–2 ran on `wan-video/wan-2.7-r2v` via the [#122](https://github.com/juspay/director/pull/122) plumbing (`BROLL_REFERENCE_MODE`).

- **Step 1 — rate:** measured `predict_time` **88.2s for a 4s 1080p clip** (real, downloaded, 1920×1080 h264). Replicate still exposes **no per-prediction $** via the API or a JS-free page, so the exact wan-r2v $/s stays an owner-dashboard read — `MODEL_RATES` keeps its flagged upper bound rather than an invented figure.
- **Step 2 — identity pilot (shots 2 & 8, conditioned on the canonical `.hero.png`):** decisive on the hero closer (shot 8) — the **i2v baseline drifted the ring silver → gold** (it inherits the per-shot keyframe, which had drifted from the canonical hero), while **reference-conditioning locked the silver titanium finish**. Shot 2 shows the same pattern more subtly (i2v warms the palette; reference mode holds the cool tone). This is the product-identity failure mode the battle-plan flagged as unaddressed by generative-consistency-plus-critics — reference-conditioning closes it. Evidence montages: `director-artifacts/reference-pilot/identity-cmp-shot{2,8}.png`.

**Still to do:** step 1 across seedance-2.0-fast / kling-v3-omni for the price bake-off; step 4 full-leg A/B (reference-conditioned hero vs keyframe-chain hero, gates + comparator decide) before any route earns the hero default. Steps 3's plumbing shipped early in [#122](https://github.com/juspay/director/pull/122).

Decision rule carried over from the leaderboard snapshot discipline: no route swap on
unverified rank or price data; every number in this doc marked *est.* must be replaced by
a measured one before it appears in any external claim.

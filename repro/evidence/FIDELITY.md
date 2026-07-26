# Fidelity progression — reproduction vs target

Gemini 2.5 Pro faithfulness score (0 = unrelated, 100 = indistinguishable), scored
each round against the original with `reference/.../compare-fidelity.mjs`.

| Round | Change | Score |
|---|---|---|
| v1 | Full animated timeline (all 5 beats + swaps + lockup) | 45 |
| v2 | + Depth-of-field + bloom + soft shadows | 60 |
| v3 | + Brushed-metal sockets, cloud dapple, floor grain | 65 |
| v4 | + Matte keycap material + softer lighting | 72 |
| v5 | + Image-based lighting (procedural environment) | 65 |
| v6 | + Darker floor to balance the IBL exposure | 70 |
| v7 | + Recessed wells, varied floor materials, softer bevels | 65 |
| v8 | + Official Recurly logo + per-segment eased camera | 65 |
| **v15** | **Scene rebuilt — see below** | **median 81** (n=4: 82/65/82/80) |
| v15 + heavy AI plate | Veo 3.1 light field, softlight 0.90/0.32 | median 69 (n=4: 68/75/65/70) |
| v15 + subtle AI plate | Veo 3.1 light field, softlight 0.34 + contrast restore | median 80 (n=3: 80/75/82) |
| v16 @2160 master, widened DOF | resolution up, focus range 0.055→0.30 | median 65 (n=3: 65/55/65) — **regression, reverted** |
| **v16 @2160 master — shipped** | resolution up, proven focus config kept | **median 75** (n=3: 75/65/85) |

## Resolution: the reference container was not a quality target

Every build up to v15 rendered **natively at 720x900** because that is the
reference clip's container. That was a mistake: 720x900 is what LinkedIn
*served* after compression, not what the piece was mastered at. Rendering
three.js natively at delivery resolution leaves zero supersampling headroom, so
edges alias and logo text turns to mush — which is exactly how it looked.

The scene now masters at **2160x2700** (`W`/`H` in `scene/theme.ts`, with `RES`
exposed for resolution-dependent effects) and downsamples with Lanczos. Effects
measured in pixels — DOF `bokehScale` and `height` — are multiplied by `RES` so
the *look* is preserved rather than shrinking threefold. Shadow maps went to
4096, the environment to 1024, multisampling to 8.

Delivered at three sizes: `2160x2700` master, `1080x1350` delivery, and
`720x900` matching the reference container frame-for-frame.

### A failed detour worth recording

While raising resolution I also widened the DOF focus range (`focalLength`
0.055 -> 0.30) to stop the hero cap face being blurred. It did sharpen the hero
— and measured **65 / 55 / 65**, far below the 80-band. Widening the focus range
also flattens background separation, and the shallow-DOF *mood* turns out to
matter far more than absolute hero sharpness. Reverting to the proven focus
config while keeping the resolution work gives **75 / 65 / 85**, statistically
indistinguishable from the 720-native build while looking dramatically cleaner.

## The score is noisy — read it as a median, not a number

Scoring the *identical* file four times returned **82, 65, 82, 80**. Run-to-run
variance is ±17 points, which is larger than most of the deltas in the table
above. Any single reading is meaningless; only repeated medians separate
variants. The earlier v1–v8 "plateau" readings were single samples and should be
treated as indicative at best.

## Why v1–v8 plateaued, and what actually broke it

Eight rounds of post-processing tuning moved the score between 65 and 72 and no
further. That was read as a limit of the comparator. It wasn't: the scene was
**fundamentally under-built**, and no amount of DOF/bloom tuning could fix it.
Comparing frames against the target directly surfaced seven concrete defects:

1. **No set dressing.** The target's frame is packed edge-to-edge with overlapping
   panels at every depth. v8 had 3–4 objects in an empty grey void.
2. **Wrong card layout.** The target uses *two* layouts — scene-1 cards are
   icon-left / two-line-charcoal-text-right with no badge; scene-2 column cards
   are badge-above-centred-indigo-label. v8 used the centred layout for both.
3. **Degenerate geometry.** `<RoundedBox>` caps its radius at half the smallest
   dimension. On a 0.17-thick keycap that is 0.085, but the code passed 0.186 —
   silently producing self-intersecting geometry. **This is why the hero trays
   and every logo face failed to render at all.** Fixed by extruding a
   rounded-rect `Shape` (`scene/Slab.tsx`), which decouples plan-view corner
   radius from plate thickness.
4. **Averaged normals.** `computeVertexNormals()` after extrusion averaged
   normals across the bevel/top boundary, flattening the bevel highlight and
   leaving a visible shading seam across every cap.
5. **Overdamped springs.** `rise()` used `damping: 200`, so caps took ~2s to
   settle and sat sunk inside their trays for most of their scene. The `dur`
   argument was never used; now pinned via `durationInFrames`.
6. **Logo scale.** `recurly-face.png` held 206×46 px of actual logo inside a
   1024×512 canvas — 2% coverage — so it rendered as a speck.
7. **Fixed fog range.** `fog(5.5, 17)` is right for the macro beats but fogged
   the far-pulled-back final lockup to flat white. Fog now travels with the camera.

## What v15 changes

- **Mosaic set dressing** (`scene/SetDressing.tsx`): ~50 extruded panel slabs —
  plain, dot-grid, ribbed metal, document, chart, and brand-colour — plus a ring
  of out-of-focus peripheral cards, so no part of frame is ever empty.
- **Macro camera**: ~30% closer, lower elevation, per-segment eased, with a
  ~11–13° Dutch roll and **animated focal length** (34° macro → 20° long lens for
  the final lockup, which is what makes Recurly and Hyperswitch read the same size).
- **Correct card layouts**, auto-fitted labels, correctly-scaled brand marks.
- **Recurly logo as a synchronous RLE alpha mask** (`scene/recurlyLogo.ts`).
  Every async route — `TextureLoader`, `<img>`+canvas, even a data URI — resolved
  but never landed in the captured frame.
- **Emissive whiten** for the end blow-out instead of alpha fade (fading opacity
  turned the heroes translucent rather than bright).
- Glossy clearcoat plates in thin brushed-metal trays; large soft area lights so
  the specular edge does not cut a hard line across the caps.

## Brand assets
- Recurly: official logo, trimmed and re-scaled, stored as an RLE alpha mask.
- Hyperswitch: Juspay roundel + stacked JUSPAY / hyperswitch lockup, drawn to
  match the target's all-white treatment.

## The AI atmospheric plate

Generated with `generate-plate.mts` (run from the repo root, which holds the
NeuroLink install):

```
set -a && . .env && set +a
node --import tsx repro/generate-plate.mts ./plate-out
```

**Replicate is not involved.** Every provider's video tool in this NeuroLink
build is image-to-video only — a text-only call fails with *"Video generation
requires an input image"* on vertex, kling and runway alike — so the script runs
the repo's documented two-stage path: a Gemini image keyframe, then Veo animates
it. Vertex/**veo-3.1-generate-preview** succeeded in **97s** (1080×1920, 8s,
24fps). Kling and Runway are kept as ordered fallbacks.

The 8s clip is cropped to its content band (rows 3–999), centre-cropped to 4:5,
resampled to 30fps and boomeranged (forward + reversed) so it loops seamlessly
across 14.5s.

**Compositing it is a trade-off, and the strong version loses.** Blending the
plate directly bleeds its panel *shapes* through as ghost rectangles over the
hero, so it must be blurred into a pure luminance field first. But a blurred
full-frame softlight layer also *lowers global contrast* — which is exactly the
"flat lighting" failure the comparator penalises. At 0.90/0.32 opacity that cost
~12 points. The shipped version uses a single broad layer at 0.34 with a small
contrast/saturation restore afterwards: score-neutral versus no plate, while
adding genuine moving caustics that a 4fps comparator sample cannot see.



## Remaining gap
- Juspay roundel's inner arrow is simplified to a droplet.
- Floor tonality still reads slightly brighter/flatter than the target's.
- The plate's light movement is broader and slower than the target's crisper
  "light through leaves" caustics.

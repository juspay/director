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
| **v15** | **Scene rebuilt — see below** | **82** |

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

## Remaining gap
- Target's dappled "light through leaves" caustics are stronger and more animated.
- Juspay roundel's inner arrow is simplified to a droplet.
- Floor tonality still reads slightly brighter/flatter than the target's.

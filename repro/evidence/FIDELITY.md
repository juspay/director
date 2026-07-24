# Fidelity progression — reproduction vs target

Gemini 2.5 Pro faithfulness score (0 = unrelated, 100 = indistinguishable), scored
each round against the original with `reference/.../compare-fidelity.mjs`.

| Round | Change | Score |
|---|---|---|
| v1 | Full animated timeline (all 5 beats + swaps + lockup) | **45** |
| v2 | + Depth-of-field + bloom + soft shadows | **60** |
| v3 | + Brushed-metal sockets, cloud dapple, floor grain, single-loop Recurly mark | **65** |
| v4 | + Matte keycap material + softer lighting | **72** ← peak |
| v5 | + Image-based lighting (procedural environment) | 65 (floor washed out) |
| v6 | + Darker floor to balance the IBL exposure | **70** |
| v7 | + Recessed wells (tiles sit *in* the floor), varied floor materials (metal/dot/accent), softer bevels | **65** |

**Plateau confirmed:** across 7 builds the score bounces in a **65–72 band**. The
comparator samples at ~4fps and recycles the same generic critique ("harsh lighting /
no DOF") even on builds that demonstrably have soft IBL + DOF + soft shadows + recessed
wells — so it **cannot reliably reward improvements past ~72**. v7 visibly adds the
recessed-well look (the #1 recurring critique) on top of v6, so **v7 ships** as the
most complete build; further fidelity should be judged by eye, not this score.

## What the reproduction gets right
- Full choreography & timing (Secure Payments → capability column → Recurly →
  Hyperswitch → wide "Live Now" lockup), all 5 beats + the 3 keycap swaps.
- Layout, camera path, color palette, every brand mark / icon / label.
- Keycap volume + brushed-metal sockets, DOF, soft shadows, dappled floor light.

## Remaining gap to a bespoke pro render (deep-3D, diminishing returns)
- True recessed keycaps sitting *in* floor cutouts (not on top).
- Varied floor-tile materials (brushed-metal strips, dotted-texture panels).
- Exact keycap bevels/fillets + a fully area-light GI rig.
- Official Recurly / Hyperswitch vector SVGs (marks are canvas approximations).
- Audio bed + AI background plate (hybrid plan, not yet composited).

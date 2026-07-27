# Full-timeline audit — all 435 frames at 1:1

Every frame of both the reference and the reproduction was extracted and
compared numerically (`scratchpad/audit/metrics.py`), then every flagged
category was confirmed by eye at true 1:1. This exists because reviewing
downscaled side-by-side sheets — where each frame is ~360px wide — cannot show
any of the defects below, and reviewing that way is what produced earlier
false "equivalent quality" claims.

Measurements are on 720×900 luma. "delta" = mean absolute frame-to-frame
difference, a proxy for on-screen motion.

## Summary

| Metric | Reference | Reproduction | |
|---|---|---|---|
| Total motion energy | 6.421 | 1.592 | **0.25×** |
| Median frame delta | 0.01208 | 0.00251 | **0.21×** |
| Global edge detail | 0.00207 | 0.00117 | **−43%** |
| Mean luminance | 0.773 | 0.808 | +0.035 |
| Crushed pixels | 0.00042 | 0.00000 | no true blacks |

---

## A. Motion — the most severe category

**A1. The reproduction barely moves.** Total motion energy is a quarter of the
reference's; the median frame delta is a fifth. **185 of 434 frames move at less
than 25% of the reference's rate**, and only 31 frames move faster. The
reference is a continuously flowing camera move; this reads as a slow drift.
This single defect probably accounts for most of the "feels nothing like it".

**A2. Transitions are 2–10% of the reference's magnitude.** The reference has
four punchy swap events; the reproduction barely registers them:

| Frame | Reference delta | Repro delta | Ratio |
|---|---|---|---|
| 66 | 0.153 | 0.0005 | 0.3% |
| 147 | 0.132 | 0.0065 | 4.9% |
| 200 | 0.159 | 0.0082 | 5.2% |
| 243 | 0.293 | 0.0143 | 4.9% |

**A3. The camera stalls at every keyframe.** Velocity drops to near zero at
f64, f110, f172, f222 and f300 (deltas 0.00047 / 0.00026 / 0.00015 / 0.00028 /
0.00040) then accelerates again. Cause: `CameraRig` applies `easeInOut`
*per segment*, so velocity is zero at every node. Needs C1-continuous
interpolation (Catmull-Rom) across the whole path, not per-segment easing.

## B. Transitions are built the wrong way

**B1. Cross-dissolving duplicated geometry produces visible double images.**
At **f243 two Hyperswitch caps are on screen simultaneously**, one from the S4
group and one from the final lockup, plus a semi-transparent Recurly — the whole
frame is ghosted. Affects roughly frames 58–70, 140–152, 192–205 and 236–258:
**~60 frames, 14% of the runtime.**

**B2. Wrong technique.** The reference has zero hard cuts and swaps keycaps as
physical in-scene events (a cap presses down, another rises). The reproduction
fades duplicate objects in and out at different positions. No amount of tuning
the fade curves fixes this; the transitions have to become motion.

## C. Framing

**C1. Elements run off the frame edge on 92 frames (162–296).** Worst at f221,
where 64% of a border band is brand colour against the reference's 29% — the
Hyperswitch cap is cut off by the right edge.

**C2. The early beats are now too wide.** The uniform 1.40× dolly-back fixed the
S2 column but overshot elsewhere: at f5 and f100 the subjects are markedly
smaller than the reference's. Framing needs per-beat tuning, not a global scale.

**C3. Composition is offset right and down** relative to the reference
throughout.

## D. Detail and set dressing

**D1. 43% less global edge detail** than the reference.

**D2. 85 frames have centre detail below 45% of the reference's.**

**D3. The set dressing is sparse and graphic.** The reference fills every depth
with layered documents, ruled lines, brushed-metal strips and dotted panels;
the reproduction has large flat colour blocks (notably the hard yellow slabs)
that read as graphic design rather than a photographed set.

## E. Tone

**E1. +0.035 mean luminance** across the clip; worst +0.187 at f243.

**E2. No true blacks** — zero crushed pixels against the reference's 0.00042.
Contributes to the flat look.

## F. Assets

**F1. Label typeface is Helvetica**; the reference uses a geometric sans with
visibly different letterforms.

**F2. The Juspay roundel's inner arrow** is simplified to a droplet.

---

## Fix order (by impact)

1. **A1/A2** — rebuild the motion: real camera travel and physical keycap swaps.
2. **B1/B2** — replace cross-dissolves with in-scene motion; removes the ghosting.
3. **A3** — spline the camera path so it never stalls.
4. **C1/C2** — per-beat framing so nothing clips and each beat is sized to match.
5. **D3/D1** — denser, less graphic set dressing.
6. **E1/E2** — exposure down slightly, restore true blacks.
7. **F1/F2** — typeface and roundel.

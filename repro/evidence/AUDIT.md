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

## THE SPEC WAS WRONG — the reference is five hard-cut shots

Working defect A2 turned up something that invalidates the original
reconstruction spec, and with it the premise the whole scene was built on.

The spec asserted **"0 hard cuts"** and **"a single continuous camera with
in-scene mechanical keycap press/rise swaps."** Both are false. The reference's
four delta spikes are **hard cuts**: inspecting f65→f66, f146→f147, f199→f200
and f242→f243 shows a complete change of camera, layout and subject across a
single frame boundary. ffmpeg's scene detection reported zero because every shot
shares the same white/blue/yellow palette, so the default threshold never
tripped, and that unverified output was written into the spec as fact.

The reference is **five shots, hard cut**, each with its own camera move:
`[0-65] [66-146] [147-199] [200-242] [243-434]`.

## Results after the fix passes

| Defect | Before | After | Reference |
|---|---|---|---|
| Total motion energy | 1.592 (0.25×) | **3.77 (0.59×)** | 6.421 |
| Median frame delta | 0.00251 (0.21×) | **0.00658 (0.54×)** | 0.01208 |
| Frames under 25% of ref motion | 185 | **43** | 0 |
| Cut at f66 | 0.0005 | **0.0913 (60%)** | 0.1529 |
| Cut at f147 | 0.0065 | **0.1878 (143%)** | 0.1318 |
| Cut at f200 | 0.0082 | **0.1441 (90%)** | 0.1595 |
| Cut at f243 | 0.0143 | **0.2076 (71%)** | 0.2932 |
| Ghosted/dissolved frames | ~60 | **0** | 0 |
| Camera-stall frames | 39 | **0** | — |
| Edge-clipping frames | 92 | **0** | — |
| Global edge detail | 0.00117 (56%) | **0.00196 (95%)** | 0.00207 |
| Centre detail | 0.00407 | **0.00585** | 0.00494 |
| Exposure offset | +0.0353 | **−0.0062** | 0 |
| Brand colour coverage | 0.16248 | **0.14704** | 0.14710 |

### Per-shot motion, after tuning

| Shot | Frames | Reference | Repro | Ratio |
|---|---|---|---|---|
| 1 | 0–65 | 0.01562 | 0.01173 | 0.75 |
| 2 | 66–146 | 0.01354 | 0.01299 | 0.96 |
| 3 | 147–199 | 0.01636 | 0.01413 | 0.86 |
| 4 | 200–242 | 0.02200 | 0.02010 | 0.91 |
| 5 | 243–434 | 0.00189 | 0.00195 | 1.03 |
| **overall median** | | 0.01208 | **0.01003** | **0.83** |

### Orbit, not travel — a correction

The first attempt at closing the motion gap scaled each shot's *positional
travel* about its mean. It hit median 1.01× and looked worse: scaling position
changes camera **distance**, so subjects shrank at the path extremes. At f8 the
Secure Payments card was a speck. The metric improved while the picture got
worse — the exact failure mode this audit exists to catch.

Shots 1–4 are now **constant-radius orbits** about their look-at point. Frame
delta comes from parallax rather than from dollying, so subject size is held
while the camera moves.

### What changed

- **Five independent shots**, Catmull-Rom camera within each and a hard cut
  between — never interpolating across a cut.
- **Cross-dissolves removed entirely.** Every cap is fully opaque for its whole
  life; shot changes swap content instantly, as the reference does.
- **Per-shot set patches**: each shot sits over a different area of the mosaic,
  so a cut changes the backdrop as well as the subject.
- Peripheral cards pushed outside the acting area (they had been intersecting
  the hero caps), brand floor accents shrunk and thinned (they were covering up
  to 2.7× the reference's frame-edge area), and suppressed beyond a radius in
  the wide shot where the reference keeps its borders neutral.
- Background blur reduced — most of the edge-detail deficit was DOF eating the
  set the reference keeps legible.
- Labels re-tracked and lightened; Juspay roundel's inner mark redrawn as an
  arrow.

## Still outstanding

- **Motion is 0.83× overall; shot 1 is 0.75×.** Widening shot 1's orbit further
  starts to swing set dressing through frame edges, so the remaining gap needs
  more on-screen subject matter in that shot rather than more camera.
- **No true blacks** (0.00000 vs 0.00042). Deepening the socket bought the
  metric but read as a heavy plinth, so it was reverted; the reference's darks
  come from tighter contact shadows.
- **22 soft frames**, all at shot entrances where caps are still rising.
- Composition within shots 1 and 2 still sits right of the reference's.

---

# Pass 3 — per-second craft analysis

Numeric auditing caught structure (cuts, stalls, clipping, framing) but said
nothing about *craft*, which is what still read as wrong. `analyze-seconds.mjs`
walks the clip one second at a time and sends every frame of that second from
BOTH videos to Gemini, interleaved and labelled, asking for concrete motion and
design differences. Output in `evidence/per-second/`.

## Treat its specific claims as hypotheses, not facts

The analyser asserted "B frames 90-119 are identical — the shot is a complete
still". Measured: mean frame delta 0.0128, matching the reference. **False.**
It also claimed B's blue is `#0000FF` and white `#FFFFFF`; measured (82,129,239)
and (234,247,246). **Both false.**

But its *directional* readings were right, and measuring them found real bugs.
Every claim below was confirmed numerically before being acted on.

## The one finding all 15 seconds agreed on

Thirteen of fifteen seconds independently named the same root cause: **lighting**
— specifically soft area-light shadows, bounced light, and *moving dappled light*
("light through leaves"). The scene had none of it on objects; the only dapple
was a static decal on the floor drawn with a basic material, which cannot affect
anything.

Fixed with a real projected gobo: a spotlight carrying a greyscale texture
(`goboTexture()` + `SpotLight.map`), so the pattern modulates light landing on
every surface and drifts across caps, panels and shadows together.

Side effect worth noting: the gobo's drifting light supplied the motion that
per-shot camera tuning could not. Median frame delta went 0.83× → **1.04×**.

## Colour, measured across the whole clip

| | Before | After | Reference |
|---|---|---|---|
| Blue | (87,119,225) | (79,105,217) | (70,106,215) |
| White | (232,243,240) | (236,233,228) | (243,245,238) |
| Gold | (228,197,**27**) | (220,195,**71**) | (216,196,**74**) |
| Overall | (194,208,208) | (196,197,198) | (189,199,201) |
| **Total abs error** | **92.4** | **77.2** | 0 |

The whites carried a cyan-green cast (R deficient), the gold was acid rather
than creamy, and every "neutral" in the set was blue-tinted.

## Two corrections to earlier conclusions

**`gl.toneMappingExposure` is a no-op** once EffectComposer owns the render —
0.92, 0.72 and 0.30 produce byte-identical frames. Earlier commits credited
exposure for level changes that were actually caused by light-intensity and
albedo edits made at the same time. Grade is now driven in the composer.

**Highlight clipping.** Chasing contrast blew up to **19% of a frame** to flat
white against the reference's 0.07%. Blown highlights erase all surface detail
and are a large part of the "cheap render" read. Caught only by measuring pure-
white pixel fraction; the earlier `blown` metric (luma > 0.99 on a downscale)
missed it entirely.

## Candidate scoring, to stop the thrashing

Seven grade/lighting variants were rendered and scored objectively on colour
error plus a clipping penalty, rather than picked by eye:

| | colour err | blown | score |
|---|---|---|---|
| **S (shipped)** | **77.2** | **0.0000** | **77.3** |
| V | 71.4 | 0.0045 | 78.1 |
| W | 70.5 | 0.0332 | 120.3 |
| X | 149.9 | 0.0007 | 150.9 |
| Y | 114.8 | 0.0186 | 142.7 |
| Z (AGX tonemap) | 300.5 | 0.0000 | 300.5 |
| AA (NEUTRAL tonemap) | 131.9 | 0.0796 | 251.2 |

AGX removes clipping completely but desaturates hard — wrong for a high-key
reference. V and W score marginally better on colour but clip up to 19% of a
frame, which is the worse defect.

## Final state

| Metric | Reference | Repro |
|---|---|---|
| Motion, median frame delta | 0.01208 | **0.01260 (1.04×)** |
| Per-shot motion | 1.00× | 0.96 / 1.12 / 1.09 / 1.04 / 1.09 |
| Cuts | 66/147/200/243 | **exact** |
| Exposure offset | 0 | **+0.0001** |
| Blown highlights | 0.0002 | **0.0000** |
| Centre detail | 0.00494 | **0.00743** |
| Edge clipping / stalls / ghosting | 0 | **0 / 0 / 0** |
| Colour error | 0 | 77.2 |

The AI plate is now redundant: it was a post blend approximating moving dappled
light, and the gobo does that in-scene and better. With plate 78.9 vs 77.2
without, so it ships without.

## Still outstanding
- Colour error 77.2, mostly whites (−7,−12,−11) and blue's red (+9.6).
- Brand coverage 0.132 vs 0.147.
- No true blacks (0.0000 vs 0.00042).
- 20 soft frames, all at shot entrances.

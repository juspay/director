# Pass 4 — the first analysis whose findings can be trusted

Produced by `analyze-seconds-v2.mjs` on the configuration validated in
`VIDEO-ANALYSIS-METHOD.md`: both complete videos as video, resolution-matched
at 720×900, retimed 2× so 24fps sampling covers every frame, `gemini-3.5-flash`
at medium resolution, 3 independent runs per second.

Two filters sit between the model and this document:

- **Ground-truth gate.** Every run must report which of the four known cuts fall
  in its second. 42 of 45 runs passed; failures were discarded, not consolidated.
- **Corroboration gate.** Only claims made by ≥2 independent runs survive.
  **66 single-run claims were dropped** against 46 kept — the tier where the old
  pipeline's fabrications lived.

Per-second reports in `analysis/per-second-v2/`.

## Where the defects are

| category | findings | mean severity | seconds affected |
|---|---|---|---|
| lighting | 15 | 3.2 | **all 15** |
| staging | 11 | **4.0** | 0,1,2,3,4,7,8,9,10,12,13 |
| camera | 10 | 3.2 | 1,3,4,6,7,9,10,14 |
| motion | 5 | 3.8 | 2,5,6,8,10 |
| material | 3 | 3.0 | 0,2,3 |
| layout | 2 | **4.0** | 11,14 |

## The four root causes

### 1. The set is not a physical surface (staging + layout, severity 4)

Named in 10 of 15 seconds, in near-identical words: B *"floats cards loosely in
3D space without a physical grid structure"*, *"piles cards in a chaotic,
overlapping floating collage disconnected in 3D space"*, against A's *"tight,
structured keyboard grid"*.

Confirmed at 1:1. The reference's cards sit **recessed into wells in a tiled
surface**, coplanar with the wall around them — keycaps in a keyboard. Mine
hover above a flat floor as separate objects. Every downstream difference in
shadow, occlusion and depth follows from this.

Worst in the final lockup (frames 243–434, **44% of the runtime**): the
reference is a clean orthogonal tile wall with soft cloud dapple and generous
empty space; mine is a pile of tilted documents with chart lines, "Success rate
99.999%" printed twice, and "Billing".

### 2. Shots build in after the cut instead of arriving resolved (staging, severity 4)

Seconds 0, 4, 5, 6, 8, 10. B *"starts with an empty layout and slides the cards
in late or sequentially after the cut"*; A cuts to shots already resolved. At
second 4 the cut lands on a **blank card** and the Recurly logo arrives 0.229s
later.

This was already visible in `AUDIT.md` as "20 soft frames at shot entrances" and
logged as a sharpness note. It is a staging error, not a sharpness one.

### 3. No contact occlusion (lighting, all 15 seconds)

The only finding present in every second. B is *"flat, high-contrast lighting
with harsh, unrealistic shadows"*, *"lacking realistic ambient occlusion"*.

Pass 3 read this same signal as "moving dappled light" and answered it with a
projected gobo. The gobo was a partially-correct response to a real signal: it
supplied light movement, but the deficit is **darkening where surfaces meet** —
which is also what cause 1 makes impossible, since nothing is in contact with
anything.

### 4. Everything is in focus (camera, severity 4)

B *"has infinite depth of field with all elements in sharp focus"*. Confirmed:
at frame 75 the reference's top and bottom fall out of focus while mine is sharp
edge to edge.

I caused this. Pass 2 reduced DOF because it was eating edge detail and the
edge-detail metric improved. The reference has genuinely shallow DOF — the fault
was the focus plane, not the effect.

Also corroborated: B's camera is *"flatter, nearly isometric"* in the early
shots and far more oblique in others, skewing type that the reference keeps
near-frontal.

## Three earlier conclusions were wrong

**"Edge clipping: 0."** False. At frame 30 the "Renewal Success" card is clipped
mid-word by the right edge (`Rene…` / `Succ…`); at frame 75 the APMs card is
**entirely outside the frame** and only two of three cards are visible. The
metric counted brand-coloured pixels touching the border, which cannot detect a
hero element that has left frame.

**"Global edge detail 95% of reference."** The totals matched while the detail
sat in the wrong places — busy background dressing compensating numerically for
missing surface and contact detail.

**"Colour error 77.2, mostly whites."** Understated. In the lockup the gold
reads olive and the blue periwinkle, but the dominant fault there is set
content and camera, not grade.

## What this changes

Passes 1–3 tuned grade, motion magnitude and camera paths — all measured against
metrics that were satisfied while the film still read as wrong. The corroborated
diagnosis is structural: **build the set as a physical recessed-tile surface,
cut to resolved shots, light for contact occlusion, and restore shallow DOF with
the focus plane on the subject.** Grade is the last step, not the first.

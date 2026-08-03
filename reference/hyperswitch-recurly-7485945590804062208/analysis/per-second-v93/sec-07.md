# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Recreate the correct PSP key design, add the brushed metal frame around the Juspay card, and adjust the blue card's color saturation and camera framing.

## Verified / surviving claims
### [sev 3] material @ t=7.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The frame around the Juspay hyperswitch key has a wide, highly reflective brushed metal texture.
- **B:** The frame around the Juspay hyperswitch key is thin and has a flat grey plastic appearance.
- **Fix (advisory):** Increase the width and adjust the metallic/roughness settings of the frame material to match the brushed metal look.
- **Channel B (Gemini):** supported — The frame around the Juspay hyperswitch key in Clip A is indeed a wide, highly reflective brushed metal texture, whereas in Clip B it is thin and has a flat grey plastic appearance.
- **Channel A (Claude):** supported — A's plinth is wide, bright-brushed, with a deep drop shadow; B's bezel is narrower and flatter.

### [sev 3] color @ t=7.20s — 2/3 runs — **MEASURED ✓**
- **A:** The blue card has a desaturated, lighter blue color.
- **B:** The blue card has a highly saturated, deep royal blue color.
- **Fix (advisory):** Reduce the saturation and lighten the blue material of the card.
- **Measurement:** {"r":173.61,"g":182.93,"b":198.46,"rb_delta":-24.85,"saturation":0.2408} vs {"r":120.57,"g":140.61,"b":206.43,"rb_delta":-85.86,"saturation":0.4064}

### [sev 2] lighting @ t=7.50s — 2/3 runs — **MEASURED ✓**
- **A:** The overall scene has softer shadows with a gentle vignette effect.
- **B:** The scene has higher contrast with sharper shadows and lacks a strong vignette.
- **Fix (advisory):** Soften the shadows and add a subtle vignette to match the reference.
- **Measurement:** {"p01":65.23,"p1":69.47,"p5":75.95,"p50":200.32,"p95":246.42,"p99":247.86,"p999":253.09,"span_p5_p95":170.47} vs {"p01":8.52,"p1":25.79,"p5":45.35,"p50":157.77,"p95":195.05,"p99":237.68,"p999":254.79,"span_p5_p95":149.7}

### [sev 3] staging @ t=7.00s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The PSP key at the bottom is a white keycap containing a recessed metallic square with a blue center.
- **B:** The PSP key at the bottom is a solid blue keycap with white text.
- **Fix (advisory):** Recreate the PSP key as a white keycap with a recessed metallic square and blue center.
- **Channel B (Gemini):** supported — The clips clearly show the difference in the PSP keycap design. In Clip A, it is a white keycap with a recessed metallic square and a blue center containing the text 'PSP'. In Clip B, it is a solid blue keycap with white 'PSP' text.
- **Channel A (Claude):** supported — Exact and actionable: A's PSP is a WHITE keycap with a small recessed indigo square carrying the text; B renders a solid blue mini-cap.

## Killed in verification
### [sev 2] camera @ t=7.50s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned closer to the main key, showing less of the surrounding keyboard grid.
- **B:** The camera is positioned further away, showing more of the surrounding keys and grid.
- **Fix (advisory):** Move the camera closer to the main key to match the reference framing.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a closer view of the 'JUSPAY hyperswitch' key, with less of the surrounding grid visible, while Clip B is zoomed out, showing more of the surrounding keys and the dotted grid pattern on the left.
- **Channel A (Claude):** refuted — B's hyperswitch card is LARGER in frame than A's; B shows more surroundings because of elevation, not distance. As stated (camera further), contradicted.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

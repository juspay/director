# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera focal length and position to match the tighter framing of the reference video.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=11.00s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Tighter camera framing crops the left edge of the yellow Recurly card.
- **B:** Wider camera framing leaves the yellow Recurly card fully visible with a margin.
- **Fix (advisory):** Adjust camera position or focal length to match the reference framing.
- **Channel B (Gemini):** supported — In Clip A, the left edge of the yellow Recurly card is cropped by the left border of the frame. In Clip B, the camera framing is wider, showing the entire yellow card with a clear margin on its left side.
- **Channel A (Claude):** refuted — The claim's A half is false: A's Recurly card is FULLY visible with a clear margin at t=11.5, not cropped at the left edge. B's Recurly is also ~13% larger in frame than A's.

### [sev 2] lighting @ t=11.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** A strong vignette is visible, with significant light falloff at the corners.
- **B:** The lighting is uniform across the frame with no corner falloff.
- **Fix (advisory):** Apply a vignette to darken the outer edges of the frame.
- **Measurement:** {"corner_mean":209.75,"center_mean":196.45,"falloff_pct":-6.77} vs {"corner_mean":167.09,"center_mean":182.82,"falloff_pct":8.61}

### [sev 2] color @ t=11.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The image exhibits high contrast with deep blacks and bright whites.
- **B:** The image has a flat luma profile with washed-out shadows and greyish highlights.
- **Fix (advisory):** Increase contrast by deepening shadows and boosting highlights.
- **Measurement:** {"p01":4.43,"p1":86.3,"p5":126.65,"p50":208.93,"p95":230.84,"p99":236.33,"p999":252.45,"span_p5_p95":104.19} vs {"p01":89.96,"p1":90.96,"p5":97.3,"p50":193.59,"p95":211.74,"p99":216.44,"p999":239.43,"span_p5_p95":114.44}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

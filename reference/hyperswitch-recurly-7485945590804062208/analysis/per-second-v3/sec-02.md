# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Apply the correct blue and yellow materials to the background blocks and adjust the layout of the dot grid to match the reference.

## Verified / surviving claims
### [sev 3] color @ t=2.10s — 3/3 runs — **MEASURED ✓**
- **A:** Vibrant blue and yellow blocks surround the white 'Secure Payments' block.
- **B:** The surrounding blocks are flat gray, lacking the blue and yellow colors.
- **Fix (advisory):** Apply the correct blue and yellow materials to the surrounding blocks.
- **Measurement:** {"r":188.21,"g":200.46,"b":204.01,"rb_delta":-15.8,"saturation":0.2023} vs {"r":214.89,"g":208.92,"b":200,"rb_delta":14.88,"saturation":0.0803}

### [sev 3] layout @ t=2.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The grid of dots is located on the left side of the vertical stack of blocks.
- **B:** The grid of dots is located on the right side of the vertical stack of blocks.
- **Fix (advisory):** Move the dot grid background element to the left side of the frame.
- **Channel B (Gemini):** supported — The claim is fully supported. In Clip A, the grid of dots is indeed located to the left of the vertical stack containing 'Subscriptions', 'Retries', and 'APMs'. In Clip B, the grid of dots is located to the right of this vertical stack.
- **Channel A (Claude):** supported — Exact: dots grid hugs the left edge in A; the dotted tile sits upper-right in B. Both halves hold as stated.

### [sev 2] lighting @ t=2.50s — 3/3 runs — **MEASURED ✓**
- **A:** Soft, dark drop shadows are visible under the floating tiles.
- **B:** Drop shadows are extremely faint, making the tiles look flat.
- **Fix (advisory):** Increase the shadow density and softness under the floating tiles.
- **Measurement:** {"p01":69.86,"p1":84.41,"p5":110.45,"p50":207.96,"p95":246.13,"p99":249,"p999":250.96,"span_p5_p95":135.68} vs {"p01":16.89,"p1":17.4,"p5":144.92,"p50":197.77,"p95":229.77,"p99":232.98,"p999":237.65,"span_p5_p95":84.85}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

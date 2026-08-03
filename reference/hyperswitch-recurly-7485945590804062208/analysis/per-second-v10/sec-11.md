# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera motion to match the dynamic zoom and pan of the reference, and correct the color temperature to be warmer, removing the cool blue-grey cast in B.

## Verified / surviving claims
### [sev 3] color @ t=11.00s — 3/3 runs — **MEASURED ✓**
- **A:** The overall color temperature is warm with a natural daylight tone, and the yellow Recurly key is a warm golden yellow.
- **B:** The overall color temperature is cool with a distinct blue-grey cast, making the yellow Recurly key appear greenish-yellow.
- **Fix (advisory):** Adjust the white balance to be warmer and shift the yellow key's hue away from green.
- **Measurement:** {"r":192.84,"g":204.41,"b":200.72,"rb_delta":-7.89,"saturation":0.1913} vs {"r":139.8,"g":152.95,"b":189.28,"rb_delta":-49.48,"saturation":0.3125}

### [sev 3] camera @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** The camera zooms out and pans continuously, causing the buttons to shrink and move towards the corners.
- **B:** The camera is nearly static, keeping the buttons at a constant size and position.
- **Fix (advisory):** Match the camera zoom-out and pan speed of the reference video.
- **Measurement:** {"mean_abs_delta":0.4707,"frames":30} vs {"mean_abs_delta":0.2747,"frames":30}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

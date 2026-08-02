# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the color grading to increase the warmth and saturation of the yellow block, and add a vignette effect in post-processing to match the reference video.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette is visible in the corners of the frame.
- **B:** No vignette is visible, corners are as bright as the center.
- **Fix (advisory):** Add a vignette effect in post-processing.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":200.44,"center_mean":182.15,"falloff_pct":-10.04}

### [sev 2] color @ t=5.40s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow block has a warmer, more saturated yellow hue.
- **B:** The yellow block is slightly cooler and less saturated.
- **Fix (advisory):** Adjust color grading to increase warmth and saturation of the yellow.
- **Measurement:** {"r":193.31,"g":198.07,"b":180.92,"rb_delta":12.39,"saturation":0.2031} vs {"r":194.38,"g":193.16,"b":172.37,"rb_delta":22.01,"saturation":0.2425}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

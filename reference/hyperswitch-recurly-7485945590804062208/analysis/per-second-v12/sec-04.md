# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 7 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the color of the yellow card to be warmer and add a vignette effect to darken the corners of the frame.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 2] lighting @ t=4.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are noticeably darker than the center, showing a strong vignette effect.
- **B:** The frame is evenly lit across the corners and center, lacking any significant vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners and match the reference lighting.
- **Measurement:** {"corner_mean":202.6,"center_mean":199.01,"falloff_pct":-1.81} vs {"corner_mean":200.57,"center_mean":216.51,"falloff_pct":7.36}

### [sev 2] color @ t=4.95s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow Recurly card has a warm, golden hue.
- **B:** The yellow Recurly card has a cooler, greenish-yellow hue.
- **Fix (advisory):** Adjust the color of the yellow card to be warmer and more golden.
- **Measurement:** {"r":197.85,"g":204.38,"b":188,"rb_delta":9.85,"saturation":0.2148} vs {"r":201.61,"g":201.27,"b":189.78,"rb_delta":11.83,"saturation":0.2018}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

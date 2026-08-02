# Second 13 — original frames 390-419

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the color grading to increase the saturation of the yellow elements and apply a vignette effect to match the reference lighting.

## Verified / surviving claims
### [sev 3] color @ t=13.80s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly card has a warm, saturated golden hue.
- **B:** The yellow card is a pale, desaturated lemon-yellow.
- **Fix (advisory):** Adjust the color grading to increase the saturation and warmth of the yellow and blue elements.
- **Measurement:** {"r":194.54,"g":204.55,"b":200.7,"rb_delta":-6.16,"saturation":0.1847} vs {"r":213.76,"g":212.74,"b":210.29,"rb_delta":3.47,"saturation":0.0982}

## Killed in verification
### [sev 3] lighting @ t=13.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center due to a strong vignette effect.
- **B:** The lighting is uniform and flat across the entire frame, lacking any corner falloff or vignette.
- **Fix (advisory):** Add a vignette effect to darken the edges of the frame and focus attention on the center.
- **Measurement:** {"corner_mean":209.4,"center_mean":193.52,"falloff_pct":-8.2} vs {"corner_mean":225.63,"center_mean":203.17,"falloff_pct":-11.05}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

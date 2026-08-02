# Second 13 — original frames 390-419

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add a vignette or adjust the light source falloff to darken the corners and edges.

## Verified / surviving claims
### [sev 2] color @ t=13.10s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly card has a warm, golden hue.
- **B:** The yellow Recurly card has a cooler, slightly greenish-yellow hue.
- **Fix (advisory):** Adjust the color temperature of the yellow material to match the warm tone of the reference.
- **Measurement:** {"r":194.14,"g":204.13,"b":200.3,"rb_delta":-6.16,"saturation":0.1878} vs {"r":164.16,"g":173.26,"b":187.49,"rb_delta":-23.33,"saturation":0.2162}

## Killed in verification
### [sev 3] lighting @ t=13.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The lighting has a pronounced vignette with significant falloff towards the corners of the frame.
- **B:** The lighting is flat and uniform across the entire frame, with almost no corner falloff.
- **Fix (advisory):** Add a vignette or adjust the light source falloff to darken the corners and edges.
- **Measurement:** {"corner_mean":209.26,"center_mean":193.58,"falloff_pct":-8.1} vs {"corner_mean":167.54,"center_mean":178,"falloff_pct":5.88}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

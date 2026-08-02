# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the lighting to deepen shadows and restore ambient occlusion, and correct the color of the yellow card to match the warmer golden-yellow tone of the reference.

## Verified / surviving claims
### [sev 3] color @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly card has a warm, golden-yellow color.
- **B:** The yellow Recurly card has a bright, highly saturated lemon-yellow color.
- **Fix (advisory):** Adjust the material color of the yellow card to match the warmer golden-yellow tone of the reference.
- **Measurement:** {"r":187.58,"g":199.25,"b":194.81,"rb_delta":-7.23,"saturation":0.2366} vs {"r":167.67,"g":178.24,"b":191.46,"rb_delta":-23.79,"saturation":0.2732}

## Killed in verification
### [sev 3] lighting @ t=11.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** High contrast with deep shadows in the crevices between tiles.
- **B:** Flat, washed-out lighting with very bright, greyish shadows.
- **Fix (advisory):** Adjust light setup and shadow settings to deepen shadows and increase contrast.
- **Measurement:** {"p01":5.74,"p1":85.8,"p5":90.3,"p50":209.07,"p95":230.56,"p99":236.33,"p999":251.64,"span_p5_p95":140.26} vs {"p01":62.28,"p1":62.94,"p5":68.27,"p50":193.52,"p95":211.8,"p99":216.23,"p999":239.3,"span_p5_p95":143.53}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

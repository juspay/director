# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the yellow card's color saturation and add a stronger vignette to match the reference video's aesthetic.

## Verified / surviving claims
### [sev 3] color @ t=9.50s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow card has a warm, muted golden-yellow hue.
- **B:** The yellow card has a highly saturated, bright lemon-yellow hue.
- **Fix (advisory):** Adjust the color of the yellow card to be warmer and less saturated.
- **Measurement:** {"r":194.9,"g":201.3,"b":210.54,"rb_delta":-15.64,"saturation":0.1976} vs {"r":170.26,"g":178.55,"b":189.35,"rb_delta":-19.09,"saturation":0.2744}

## Killed in verification
### [sev 3] lighting @ t=9.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are noticeably darker than the center, showing a strong vignette.
- **B:** The corners of the frame are bright and lack a prominent vignette.
- **Fix (advisory):** Add a vignette to darken the corners of the frame.
- **Measurement:** {"corner_mean":203.26,"center_mean":200.61,"falloff_pct":-1.32} vs {"corner_mean":170.66,"center_mean":177.57,"falloff_pct":3.89}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

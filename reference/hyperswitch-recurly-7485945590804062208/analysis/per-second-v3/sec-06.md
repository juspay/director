# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply a cool blue color cast and add a vignette to darken the corners of the frame to match the reference lighting.

## Verified / surviving claims
### [sev 2] color @ t=6.20s — 3/3 runs — **MEASURED ✓**
- **A:** The white cards have a cool, blue-tinted color cast.
- **B:** The white cards are neutral white/grey with no blue tint.
- **Fix (advisory):** Apply a cool color grade or adjust the light colors to introduce a blue cast.
- **Measurement:** {"r":182.92,"g":170.5,"b":76.53,"rb_delta":106.39,"saturation":0.5258} vs {"r":213.93,"g":189.31,"b":79.89,"rb_delta":134.04,"saturation":0.6236}

## Killed in verification
### [sev 2] lighting @ t=6.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center due to a vignette.
- **B:** The corners of the frame have similar brightness to the center.
- **Fix (advisory):** Add a vignette to darken the corners of the frame.
- **Measurement:** {"corner_mean":194.67,"center_mean":177.16,"falloff_pct":-9.88} vs {"corner_mean":205.45,"center_mean":184.19,"falloff_pct":-11.54}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle to match the top-down perspective of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=0.00s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** Camera is positioned nearly top-down over the tiles.
- **B:** Camera is at a low, oblique angle looking from the side.
- **Fix (advisory):** Match the top-down camera angle of the reference.
- **Channel B:** Clip A shows a nearly top-down camera angle over the tiles, while Clip B shows a low, oblique angle looking from the side.

### [sev 2] color @ t=0.30s — 2/3 runs — **MEASURED ✓**
- **A:** White tiles have a neutral, warm tone.
- **B:** White tiles have a cool, bluish-grey color cast.
- **Fix (advisory):** Adjust white balance to remove the cool color cast.
- **Measurement:** {"r":190.25,"g":199.25,"b":201.91,"rb_delta":-11.66,"saturation":0.207} vs {"r":188.75,"g":198.24,"b":212.28,"rb_delta":-23.53,"saturation":0.2238}

## Killed in verification
### [sev 2] lighting @ t=0.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignette with darker corners.
- **B:** Weaker vignette with brighter corners.
- **Fix (advisory):** Add a vignette to darken the corners.
- **Measurement:** {"corner_mean":202.03,"center_mean":205.44,"falloff_pct":1.66} vs {"corner_mean":192.24,"center_mean":219.88,"falloff_pct":12.57}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

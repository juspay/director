# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera height, pitch, and field of view to match the reference's top-down perspective, and increase the vignette strength to match the corner falloff.

## Verified / surviving claims
### [sev 3] camera @ t=7.20s — 3/3 runs — **MEASURED ✓**
- **A:** The camera is positioned close to the grid, looking almost directly down at the 'JUSPAY hyperswitch' tile.
- **B:** The camera is at a lower, shallower angle and further away, revealing more of the grid.
- **Fix (advisory):** Adjust the camera height, pitch, and field of view to match the reference's top-down perspective.
- **Measurement:** {"lap_var":75.95} vs {"lap_var":7.24}

### [sev 2] lighting @ t=7.50s — 2/3 runs — **MEASURED ✓**
- **A:** Pronounced vignette darkening the frame corners.
- **B:** Brighter corners with a much weaker vignette.
- **Fix (advisory):** Increase vignette strength.
- **Measurement:** {"corner_mean":206.79,"center_mean":110.73,"falloff_pct":-86.76} vs {"corner_mean":182.02,"center_mean":86.83,"falloff_pct":-109.63}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

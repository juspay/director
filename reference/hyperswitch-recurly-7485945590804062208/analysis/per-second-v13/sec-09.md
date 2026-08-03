# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 1 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position, rotation, and focal length to match the reference framing and perspective.

## Verified / surviving claims
### [sev 3] camera @ t=9.20s — 3/3 runs — **MEASURED ✓**
- **A:** Camera is closer to the grid, framing the 'Live Now' button and cards tightly.
- **B:** Camera is pulled back, showing a much wider view of the grid with smaller elements.
- **Fix (advisory):** Adjust camera position and focal length to match the tighter framing of the reference.
- **Measurement:** {"corner_mean":202.63,"center_mean":200.05,"falloff_pct":-1.29} vs {"corner_mean":199.7,"center_mean":183.12,"falloff_pct":-9.06}

### [sev 2] color @ t=9.20s — 3/3 runs — **MEASURED ✓**
- **A:** Yellow card is a warm golden hue.
- **B:** Yellow card is a cooler, desaturated yellow.
- **Fix (advisory):** Adjust yellow card color to be warmer.
- **Measurement:** {"r":194.14,"g":200.7,"b":210.99,"rb_delta":-16.85,"saturation":0.2} vs {"r":172.15,"g":182.94,"b":217.13,"rb_delta":-44.97,"saturation":0.2999}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position, angle, and focal length to match the closer, more dynamic perspective of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=8.50s — 2/3 runs — **MEASURED ✓**
- **A:** The camera is positioned closer to the yellow Recurly card with a lower, more dramatic perspective angle.
- **B:** The camera is positioned further away with a higher, more top-down perspective angle, making the yellow card appear smaller.
- **Fix (advisory):** Adjust camera position and rotation to match the closer, lower-angle perspective of the reference.
- **Measurement:** {"lap_var":141.73} vs {"lap_var":35.93}

## Killed in verification
### [sev 2] color @ t=8.05s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The white keys and background elements show a cool, bluish color cast.
- **B:** The white keys are neutral white and grey, lacking the cool tint.
- **Fix (advisory):** Apply a cool color grade to match the reference white balance.
- **Measurement:** {"r":180.02,"g":190.52,"b":206.41,"rb_delta":-26.39,"saturation":0.2557} vs {"r":136.92,"g":150.73,"b":198.78,"rb_delta":-61.86,"saturation":0.2877}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

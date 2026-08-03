# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Align the camera angle and tile layout to match the reference composition.

## Verified / surviving claims
### [sev 3] layout @ t=7.10s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The 'PSP' tile is positioned directly below the 'JUSPAY hyperswitch' tile.
- **B:** The 'PSP' tile is shifted to the left, out of alignment with the 'JUSPAY hyperswitch' tile.
- **Fix (advisory):** Adjust the grid layout of the tiles to align the 'PSP' tile directly underneath the 'JUSPAY hyperswitch' tile.
- **Channel B:** The comparison is accurate. In Clip A, the 'PSP' tile is centered directly below the 'JUSPAY hyperswitch' tile, whereas in Clip B, it is shifted to the left and out of alignment.

### [sev 2] camera @ t=7.30s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera is positioned at a steeper angle relative to the grid, showing less perspective distortion.
- **B:** The camera is at a shallower angle, creating a stronger perspective effect on the tiles.
- **Fix (advisory):** Adjust the camera tilt and position to match the steeper angle of the reference video.
- **Channel B:** Clip A shows a camera angle that is closer to a top-down view (steeper angle), resulting in less perspective distortion of the grid tiles. Clip B shows a more oblique, shallower camera angle, which creates a much stronger perspective effect where the tiles visibly recede and converge towards a vanishing point.

### [sev 2] lighting @ t=7.60s — 2/3 runs — **MEASURED ✓**
- **A:** The corners of the frame are darker than the center, showing a distinct vignette.
- **B:** The corners are nearly as bright as the center, with very uniform illumination.
- **Fix (advisory):** Add a vignette effect to darken the corners of the frame.
- **Measurement:** {"corner_mean":207.85,"center_mean":110.92,"falloff_pct":-87.39} vs {"corner_mean":169.99,"center_mean":87.93,"falloff_pct":-93.32}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

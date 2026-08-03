# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position and focal length to match the tighter framing of the reference video.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=12.10s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned closer to the buttons, resulting in a tighter framing.
- **B:** The camera is further away, creating a wider framing with more surrounding tiles.
- **Fix (advisory):** Adjust camera distance to match reference framing.
- **Measurement:** {"lap_var":440.46} vs {"lap_var":442.48}

### [sev 2] lighting @ t=12.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center due to a strong vignette.
- **B:** The corners are almost as bright as the center, with very flat illumination.
- **Fix (advisory):** Apply a vignette to darken the corners of the frame.
- **Measurement:** {"corner_mean":209.43,"center_mean":194.03,"falloff_pct":-7.93} vs {"corner_mean":198.13,"center_mean":180.31,"falloff_pct":-9.89}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

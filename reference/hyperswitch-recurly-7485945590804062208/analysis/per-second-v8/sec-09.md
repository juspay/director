# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add a vignette and enable camera depth of field to match the reference's cinematic look.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** A strong vignette is present, with noticeable light falloff at the corners.
- **B:** The lighting is uniform across the frame with no apparent vignette.
- **Fix (advisory):** Apply a vignette to darken the corners.
- **Measurement:** {"corner_mean":203.26,"center_mean":200.61,"falloff_pct":-1.32} vs {"corner_mean":170.66,"center_mean":183.29,"falloff_pct":6.89}

### [sev 2] camera @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The background tiles in the corners are softly blurred due to a shallow depth of field.
- **B:** The background tiles in the corners remain sharp and in focus.
- **Fix (advisory):** Enable depth of field on the camera and adjust the aperture.
- **Measurement:** {"lap_var":4.54} vs {"lap_var":3.09}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

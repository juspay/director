# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust camera position and focal length to match the close-up framing.

## Verified / surviving claims
### [sev 3] camera @ t=0.50s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** Close-up framing on the 'Secure Payments' tile, with surrounding tiles mostly cropped out.
- **B:** Wide framing showing multiple surrounding tiles, with the main tile appearing much smaller.
- **Fix (advisory):** Adjust camera position and focal length to match the close-up framing.
- **Channel B:** Clip A shows a tight close-up on the 'Secure Payments' tile, with the surrounding tiles heavily cropped. Clip B has a wider framing where the 'Secure Payments' tile is smaller and more of the surrounding tiles are visible.

## Killed in verification
### [sev 3] lighting @ t=0.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Pronounced vignette darkening the corners of the frame.
- **B:** Even, flat illumination across the entire frame with no vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":202.03,"center_mean":205.44,"falloff_pct":1.66} vs {"corner_mean":183.6,"center_mean":214.9,"falloff_pct":14.56}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

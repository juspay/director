# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera tilt and rotation to achieve the diagonal perspective of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=8.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is tilted dynamically, causing the keyboard grid lines to run diagonally across the frame.
- **B:** The camera is positioned more directly overhead, making the keyboard grid lines align almost horizontally and vertically.
- **Fix (advisory):** Adjust the camera tilt and rotation to achieve the diagonal perspective of the reference.
- **Channel B (Gemini):** supported — In Clip A, the keyboard grid lines run diagonally across the frame due to a tilted camera angle. In Clip B, the camera is positioned directly overhead, aligning the grid lines horizontally and vertically with the frame.
- **Channel A (Claude):** supported — B is more directly overhead than A here — consistent with the elevation running a few degrees hot since pass 8.

### [sev 2] lighting @ t=8.50s — 2/3 runs — **MEASURED ✓**
- **A:** There is a pronounced vignette that darkens the corners of the frame.
- **B:** The lighting is flat and uniform, with no noticeable corner darkening.
- **Fix (advisory):** Apply a vignette to darken the outer edges of the frame.
- **Measurement:** {"corner_mean":174.81,"center_mean":180.43,"falloff_pct":3.11} vs {"corner_mean":150.49,"center_mean":148.54,"falloff_pct":-1.32}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

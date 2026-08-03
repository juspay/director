# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera focal length and angle to match the dynamic perspective of the reference, and introduce a vignette to fix the flat lighting.

## Verified / surviving claims
### [sev 3] camera @ t=5.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** Low, dynamic camera angle with strong perspective distortion showing the Recurly card tilted.
- **B:** Flatter camera angle with less perspective distortion, making the card appear parallel to the screen.
- **Fix (advisory):** Adjust camera focal length and tilt to match the dynamic perspective of the reference.
- **Channel B:** The comparison is accurate. Clip A shows a low, dynamic camera angle with strong perspective distortion where the Recurly card is tilted, while Clip B shows a flatter, more top-down camera angle with less perspective distortion, making the card appear parallel to the screen.

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette and soft lighting gradients create depth with darker corners.
- **B:** Flat, uniform lighting across the frame with minimal corner falloff.
- **Fix (advisory):** Add a vignette and adjust light sources to create dramatic light falloff.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":208.45,"center_mean":188.45,"falloff_pct":-10.61}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle to be lower and more oblique, and add a strong vignette to match the depth and lighting of the reference.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=10.20s — 3/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera is at a low, oblique perspective, creating a strong sense of depth.
- **B:** The camera is at a higher, flatter top-down angle.
- **Fix (advisory):** Lower the camera angle to match the reference perspective.
- **Channel B:** The claim has reversed the descriptions of Clip A and Clip B. Clip A shows a flat, top-down perspective, while Clip B shows an oblique perspective with a strong sense of depth.

### [sev 3] lighting @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The frame has a distinct vignette with darkened corners.
- **B:** The frame corners are bright white with no vignette falloff.
- **Fix (advisory):** Add a vignette post-processing effect.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":198.17,"center_mean":180.63,"falloff_pct":-9.71}

### [sev 2] color @ t=10.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow button has a warm, golden-yellow hue.
- **B:** The yellow button is a highly saturated, bright lemon-yellow.
- **Fix (advisory):** Adjust the color grading of the yellow material to be warmer.
- **Measurement:** {"r":193.29,"g":203.73,"b":201.96,"rb_delta":-8.67,"saturation":0.191} vs {"r":191.89,"g":197.21,"b":218.59,"rb_delta":-26.71,"saturation":0.1831}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

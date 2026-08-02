# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera distance and focal length to match the closer framing of the reference video.

## Verified / surviving claims
### [sev 3] color @ t=14.20s — 2/3 runs — **MEASURED ✓**
- **A:** The scene has a warm color cast with cream-toned cards and saturated blues.
- **B:** The scene has a cooler, neutral gray color cast with less saturated tones.
- **Fix (advisory):** Apply a warm color grade and increase saturation to match the reference.
- **Measurement:** {"r":194.72,"g":204.52,"b":200.82,"rb_delta":-6.1,"saturation":0.1835} vs {"r":164.42,"g":174.22,"b":191.09,"rb_delta":-26.67,"saturation":0.2246}

## Killed in verification
### [sev 3] camera @ t=14.00s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned closer to the grid, framing the Recurly and hyperswitch tiles prominently.
- **B:** The camera is positioned much further away, resulting in a wider shot with smaller tiles.
- **Fix (advisory):** Adjust the camera distance or focal length to match the closer framing of the reference.
- **Channel B (Gemini):** supported — Clip A shows a close-up view where the Recurly and hyperswitch tiles fill most of the frame. Clip B shows a wider shot from further away, making the tiles appear smaller and revealing more of the surrounding grid.
- **Channel A (Claude):** refuted — Same lockup family as 9/10/13: size parity or B larger; 'much further away, smaller cards' contradicted by the frames.

### [sev 3] lighting @ t=14.50s — 2/3 runs — **EYEWITNESS REFUTED ✗ (B)**
- **A:** The lighting features a distinct vignette, with noticeable darkening towards the corners.
- **B:** The lighting is flat and uniform across the entire frame, lacking corner falloff.
- **Fix (advisory):** Introduce a vignette effect to match the corner shading of the reference.
- **Channel B (Gemini):** refuted — The claim is refuted because Clip A does not feature a distinct vignette with noticeable darkening towards the corners (the corners are actually quite bright), and Clip B does not have flat, uniform lighting (it has 3D shadows and a visible vignette/darkening towards the corners).

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

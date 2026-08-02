# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera perspective to match the steeper angle of the reference, and apply vibrant color grading with a vignette.

## Verified / surviving claims
### [sev 3] camera @ t=0.10s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned at a steep angle, showing the blue block on the left and yellow block at the bottom.
- **B:** The camera is at a shallow, tilted perspective, and the surrounding blocks are grey.
- **Fix (advisory):** Adjust the camera angle to match the steeper perspective of the reference.
- **Channel B (Gemini):** supported — The claim accurately describes the visual differences between the two clips. Clip A shows a steep camera angle with a blue block on the left and a yellow block at the bottom, while Clip B shows a shallow, tilted perspective with grey surrounding blocks.
- **Channel A (Claude):** supported — Real, but the driver is ELEVATION not distance: A shoots ~70deg down into a dense frame (Renewal+blue+yellow all in frame, type horizontal); B orbits low-oblique (~35-40deg) with type rotated ~40deg and sparse pale surroundings.

### [sev 4] color @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** The blue and yellow blocks are highly saturated and vibrant.
- **B:** The blocks are desaturated, appearing mostly grey and white.
- **Fix (advisory):** Increase color saturation and adjust hues to match the reference.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":188.18,"g":195.19,"b":210.91,"rb_delta":-22.72,"saturation":0.106}

## Killed in verification
### [sev 3] lighting @ t=0.80s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Distinct corner vignette and soft shadows between the blocks.
- **B:** Flat, uniform lighting across the frame with minimal corner falloff.
- **Fix (advisory):** Add a vignette and deepen the shadows to increase contrast.
- **Measurement:** {"corner_mean":204.05,"center_mean":203.81,"falloff_pct":-0.11} vs {"corner_mean":196.51,"center_mean":203.26,"falloff_pct":3.32}

## Present in A, absent in B (corroborated, unverified inventory)
- blue card
- yellow card

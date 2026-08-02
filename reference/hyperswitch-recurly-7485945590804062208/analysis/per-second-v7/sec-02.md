# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera angle to match the steep top-down perspective and restore the vibrant blue and yellow color palette to the surrounding cards.

## Verified / surviving claims
### [sev 3] color @ t=2.10s — 3/3 runs — **MEASURED ✓**
- **A:** The keyboard blocks surrounding the 'Secure Payments' key have distinct blue and yellow colors.
- **B:** The surrounding keyboard blocks are entirely gray and white, lacking any color.
- **Fix (advisory):** Apply the blue and yellow materials to the surrounding keyboard blocks to match the reference.
- **Measurement:** {"r":188.21,"g":200.46,"b":204.01,"rb_delta":-15.8,"saturation":0.2023} vs {"r":200.45,"g":203.64,"b":208.47,"rb_delta":-8.01,"saturation":0.0377}

### [sev 2] camera @ t=2.10s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned closer to the keys with a steeper angle of view, showing less of the surrounding grid.
- **B:** The camera is further back with a shallower angle, showing more of the surrounding grid and creating a different perspective.
- **Fix (advisory):** Adjust the camera's position and focal length to match the reference framing.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a close-up, top-down (steeper) view of the 'Secure Payments' and 'Renewal Success' keys, showing very little of the surrounding grid. Clip B is shot from a further distance and a shallower, more oblique angle, revealing more of the surrounding grid and keys.
- **Channel A (Claude):** supported — Verified on frames: A near-top-down and dense; B raked low with cards nearly edge-on and type at ~50deg.

### [sev 2] lighting @ t=2.50s — 3/3 runs — **MEASURED ✓**
- **A:** The lighting has higher contrast with deeper shadows between the keys.
- **B:** The lighting is flat and washed out, with very faint shadows.
- **Fix (advisory):** Increase the contrast and adjust the shadow settings to create more depth.
- **Measurement:** {"p01":69.86,"p1":84.41,"p5":110.45,"p50":207.96,"p95":246.13,"p99":249,"p999":250.96,"span_p5_p95":135.68} vs {"p01":72.53,"p1":98.72,"p5":169.65,"p50":201.72,"p95":222.31,"p99":224.31,"p999":254,"span_p5_p95":52.66}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
- blue and yellow background cards

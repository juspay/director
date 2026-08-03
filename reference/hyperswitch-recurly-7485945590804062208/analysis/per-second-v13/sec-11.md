# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position and focal length to match the tighter framing and perspective of the reference video.

## Verified / surviving claims
### [sev 2] lighting @ t=11.20s — 2/3 runs — **MEASURED ✓**
- **A:** The frame edges show a distinct vignette with darker corners.
- **B:** The frame edges are evenly lit with no vignette.
- **Fix (advisory):** Add a vignette in post-processing or adjust camera lens shading.
- **Measurement:** {"corner_mean":209.77,"center_mean":197.73,"falloff_pct":-6.09} vs {"corner_mean":212.98,"center_mean":190.07,"falloff_pct":-12.05}

## Killed in verification
### [sev 3] camera @ t=11.00s — 3/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera is positioned closer to the yellow Recurly tile, creating a tight framing.
- **B:** The camera is positioned further back, resulting in a wider framing with more surrounding tiles visible.
- **Fix (advisory):** Adjust camera position and focal length to match the reference framing.
- **Channel B:** The claim is the opposite of what is shown. In Clip A, the camera is positioned further back, making the tiles appear smaller with more of the background grid visible. In Clip B, the camera is closer, making the tiles appear larger, to the point where the top-left grey border of the yellow Recurly tile is cut off by the edge of the frame.

### [sev 2] color @ t=11.00s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow tile has a warm, highly saturated golden color.
- **B:** The yellow tile is cooler and less saturated.
- **Fix (advisory):** Adjust the material color of the yellow tile to increase saturation and warmth.
- **Measurement:** {"r":192.84,"g":204.41,"b":200.72,"rb_delta":-7.89,"saturation":0.1913} vs {"r":197.68,"g":202.16,"b":223.2,"rb_delta":-25.52,"saturation":0.1902}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

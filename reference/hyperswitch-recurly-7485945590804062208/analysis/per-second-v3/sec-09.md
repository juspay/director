# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 1 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the lighting and post-processing to introduce a cool color grade, deeper shadows, and a strong vignette.

## Verified / surviving claims
### [sev 3] camera @ t=9.00s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned closer to the tiles, resulting in a tighter framing of the Recurly and Hyperswitch cards.
- **B:** The camera is positioned further back, resulting in a wider framing where the cards appear smaller.
- **Fix (advisory):** Adjust the camera's Z-position to match the closer framing of the reference video.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a close-up, tight framing of the Recurly and Hyperswitch cards, while Clip B shows a wider shot where the cards are smaller and more surrounding tiles are visible.
- **Channel A (Claude):** supported — Direction holds with modest magnitude: B's brand cards are ~12-15% smaller in frame and surrounded by more empty tile area. (Unclaimed but conspicuous at this moment: A shows strong dappled light pools across the wall and B is uniformly flat, and B's whole frame is soft.)

### [sev 3] color @ t=9.50s — 3/3 runs — **MEASURED ✓**
- **A:** The white tiles exhibit a cool blue color cast.
- **B:** The white tiles are neutral grey and white.
- **Fix (advisory):** Adjust the white balance or add a cool color grade.
- **Measurement:** {"r":187.83,"g":198.44,"b":204.9,"rb_delta":-17.08,"saturation":0.1734} vs {"r":207.57,"g":206.34,"b":202.46,"rb_delta":5.11,"saturation":0.1253}

### [sev 3] lighting @ t=9.50s — 2/3 runs — **MEASURED ✓**
- **A:** The corners of the frame are significantly darker than the center, creating a strong vignette.
- **B:** The lighting is uniform across the frame with no visible vignette.
- **Fix (advisory):** Add a vignette post-processing effect to darken the corners.
- **Measurement:** {"corner_mean":203.26,"center_mean":200.61,"falloff_pct":-1.32} vs {"corner_mean":219.75,"center_mean":197.79,"falloff_pct":-11.1}

## Killed in verification
### [sev 3] lighting @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows between the tiles are deeper and have more contrast.
- **B:** The shadows are very bright and flat, resulting in lower contrast.
- **Fix (advisory):** Adjust the luma curve to deepen the shadows and increase contrast.
- **Measurement:** {"p01":62.41,"p1":94.19,"p5":107.96,"p50":202.15,"p95":246.35,"p99":249.79,"p999":253,"span_p5_p95":138.39} vs {"p01":81.92,"p1":83.41,"p5":100.44,"p50":216.63,"p95":237.71,"p99":239.14,"p999":240.85,"span_p5_p95":137.27}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

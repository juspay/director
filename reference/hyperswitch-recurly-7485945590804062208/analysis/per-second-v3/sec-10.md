# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Match the camera perspective angle and focal length, and add a vignette and contact shadows to restore depth.

## Verified / surviving claims
### [sev 3] lighting @ t=10.50s — 2/3 runs — **MEASURED ✓**
- **A:** Strong vignette with noticeable falloff towards the corners of the frame.
- **B:** Flat lighting with almost no vignetting in the corners.
- **Fix (advisory):** Add a vignette pass to darken the corners of the frame.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":226.83,"center_mean":202.73,"falloff_pct":-11.89}

### [sev 3] lighting @ t=10.50s — 3/3 runs — **MEASURED ✓**
- **A:** Deeper shadows in the crevices between tiles, creating a sense of depth.
- **B:** Brighter shadows, making the tiles look flat and disconnected.
- **Fix (advisory):** Increase shadow density and ambient occlusion in crevices.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":95.72,"p1":98.93,"p5":108.65,"p50":224.28,"p95":238,"p99":238.43,"p999":239.92,"span_p5_p95":129.35}

## Killed in verification
### [sev 3] camera @ t=10.50s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera has a dramatic perspective angle, showing significant depth and tilt on the tiles.
- **B:** The camera angle is flatter and more top-down, reducing the perspective depth.
- **Fix (advisory):** Adjust the camera focal length and tilt to match the reference perspective.
- **Channel B:** The descriptions of Clip A and Clip B are swapped. Clip A shows a flat, top-down camera angle with minimal perspective depth, while Clip B shows a dramatic perspective angle with significant depth and tilt on the 3D tiles.

### [sev 2] color @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Warm, creamy tone on the white tiles.
- **B:** Cool, neutral white color cast across the tiles.
- **Fix (advisory):** Adjust the white balance to introduce warmer tones.
- **Measurement:** {"r":193.29,"g":203.73,"b":201.96,"rb_delta":-8.67,"saturation":0.191} vs {"r":213.35,"g":212.47,"b":209.96,"rb_delta":3.39,"saturation":0.1016}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

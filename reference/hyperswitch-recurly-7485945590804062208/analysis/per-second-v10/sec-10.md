# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position and angle to match the oblique perspective and closer framing of the reference video.

## Verified / surviving claims
### [sev 2] material @ t=10.50s — 2/3 runs — **MEASURED ✓**
- **A:** A soft diagonal glossy reflection is visible across the yellow 'Recurly' keycap.
- **B:** The yellow 'Recurly' keycap has a flat matte appearance with no diagonal reflection.
- **Fix (advisory):** Increase the specularity or adjust the roughness of the yellow material to capture the glossy reflection.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":73.68,"p1":75.18,"p5":80.1,"p50":169.12,"p95":183.98,"p99":191.47,"p999":239.78,"span_p5_p95":103.88}

## Killed in verification
### [sev 3] camera @ t=10.20s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The yellow 'Recurly' keycap is larger in the frame and viewed from a lower, more oblique angle.
- **B:** The yellow 'Recurly' keycap is smaller in the frame and viewed from a higher, more top-down angle.
- **Fix (advisory):** Adjust the camera position and pitch angle to match the reference framing.
- **Channel B:** The claims about the camera angles are reversed. Clip A shows the yellow 'Recurly' keycap from a flat, top-down angle, whereas Clip B shows it from an oblique, 3D perspective angle where the sides of the keycap are visible.

### [sev 2] lighting @ t=10.00s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are noticeably darker than the center, showing a strong vignette.
- **B:** The corners of the frame are nearly as bright as the center, with minimal vignette.
- **Fix (advisory):** Add a vignette post-processing effect to darken the corners.
- **Measurement:** {"corner_mean":209.59,"center_mean":201.4,"falloff_pct":-4.07} vs {"corner_mean":150.39,"center_mean":155.22,"falloff_pct":3.11}

### [sev 2] color @ t=10.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The white keycaps and background elements exhibit a cool blue color tint.
- **B:** The white keycaps and background are neutral white and grey.
- **Fix (advisory):** Apply a cool blue color grading or adjust the white balance.
- **Measurement:** {"r":192.29,"g":203.72,"b":200.23,"rb_delta":-7.94,"saturation":0.1938} vs {"r":139.74,"g":152.89,"b":189.26,"rb_delta":-49.52,"saturation":0.3128}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

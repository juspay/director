# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust camera angle and tilt to match the dynamic diagonal composition of the reference, and deepen the shadow contrast in the recesses.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Pronounced vignette with darker corners.
- **B:** Even illumination across the frame with minimal corner falloff.
- **Fix (advisory):** Apply a vignette to match the corner shading.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":149.66,"center_mean":156.64,"falloff_pct":4.46}

### [sev 3] lighting @ t=10.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows in the crevices between the tiles are deep and dark, creating high contrast.
- **B:** The crevices are brightly lit with very shallow shadows, making the scene look flat.
- **Fix (advisory):** Increase ambient occlusion or darken the shadow tones in the crevices between tiles.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":73.68,"p1":75.18,"p5":80.1,"p50":170.12,"p95":183.98,"p99":189.63,"p999":239.5,"span_p5_p95":103.88}

### [sev 3] color @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Yellow button has a warmer, more saturated golden hue.
- **B:** Yellow button is cooler and less saturated.
- **Fix (advisory):** Adjust yellow button color to be warmer and more saturated.
- **Measurement:** {"r":193.29,"g":203.73,"b":201.96,"rb_delta":-8.67,"saturation":0.191} vs {"r":140.43,"g":153.59,"b":189.96,"rb_delta":-49.53,"saturation":0.312}

### [sev 3] camera @ t=10.50s — 3/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** Camera is closer to the yellow button with a steeper tilt angle.
- **B:** Camera is further zoomed out with a flatter perspective.
- **Fix (advisory):** Match camera distance and perspective angle to reference.
- **Channel B:** Clip A shows a completely flat, orthogonal (top-down) perspective where the buttons appear as flat 2D shapes. Clip B, on the other hand, shows a tilted 3D perspective where the depth and side edges of the buttons are clearly visible. Therefore, Clip B does not have a flatter perspective than Clip A.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

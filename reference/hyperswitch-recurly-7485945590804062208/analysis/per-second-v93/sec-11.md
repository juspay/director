# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust light source intensity and shadow settings to deepen shadows and apply a vignette effect to match the reference.

## Verified / surviving claims
### [sev 2] lighting @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** The shadows between the keys are deep and well-defined, creating high contrast.
- **B:** The shadows between the keys are faint and washed out, resulting in lower contrast.
- **Fix (advisory):** Adjust light source intensity and shadow settings to deepen shadows.
- **Measurement:** {"p01":5.74,"p1":85.8,"p5":90.3,"p50":209.07,"p95":230.56,"p99":236.33,"p999":251.64,"span_p5_p95":140.26} vs {"p01":73.68,"p1":75.18,"p5":80.24,"p50":170.12,"p95":183.69,"p99":190.16,"p999":239.5,"span_p5_p95":103.45}

## Killed in verification
### [sev 2] lighting @ t=11.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The white keyboard keys in the corners of the frame are shaded darker, creating a clear vignette effect.
- **B:** The white keyboard keys in the corners are bright white, showing almost no corner shading or vignette.
- **Fix (advisory):** Apply a vignette effect to darken the outer edges of the frame.
- **Measurement:** {"corner_mean":209.75,"center_mean":196.45,"falloff_pct":-6.77} vs {"corner_mean":148.97,"center_mean":156.03,"falloff_pct":4.52}

### [sev 2] color @ t=11.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow Recurly button has a highly saturated golden-yellow color.
- **B:** The yellow Recurly button is paler and less saturated.
- **Fix (advisory):** Increase saturation and adjust hue of the yellow button material.
- **Measurement:** {"r":192.94,"g":204.4,"b":200.57,"rb_delta":-7.63,"saturation":0.1915} vs {"r":140.33,"g":153.51,"b":189.77,"rb_delta":-49.44,"saturation":0.3118}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

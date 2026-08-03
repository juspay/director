# Second 13 — original frames 390-419

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle and focal length to match the flatter, more top-down perspective of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=13.50s — 2/3 runs — **MEASURED ✓**
- **A:** The camera perspective is flatter with a more top-down angle, showing less of the card sides.
- **B:** The camera perspective is more oblique with a shallower angle, showing more dramatic card side extrusion.
- **Fix (advisory):** Match the camera's pitch angle and field of view to the reference.
- **Measurement:** {"lap_var":434.59} vs {"lap_var":35.37}

### [sev 3] lighting @ t=13.50s — 2/3 runs — **MEASURED ✓**
- **A:** The shadows in the crevices between the tiles are soft, light grey, and diffused.
- **B:** The shadows between the tiles are extremely dark, sharp, and high-contrast.
- **Fix (advisory):** Increase the ambient occlusion radius and soften the direct light shadows.
- **Measurement:** {"p01":4.46,"p1":86.22,"p5":90.44,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.14,"span_p5_p95":141.03} vs {"p01":73.68,"p1":74.83,"p5":80.1,"p50":169.05,"p95":182.69,"p99":189.32,"p999":239.74,"span_p5_p95":102.59}

### [sev 2] color @ t=13.50s — 2/3 runs — **MEASURED ✓**
- **A:** The blue 'hyperswitch' tile has a muted, royal blue hue with a soft gradient from the lighting.
- **B:** The blue 'hyperswitch' tile has a highly saturated, flat blue color.
- **Fix (advisory):** Desaturate the diffuse color of the blue tile material.
- **Measurement:** {"r":194.53,"g":204.41,"b":200.72,"rb_delta":-6.2,"saturation":0.1862} vs {"r":139.64,"g":152.87,"b":189.5,"rb_delta":-49.86,"saturation":0.3127}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

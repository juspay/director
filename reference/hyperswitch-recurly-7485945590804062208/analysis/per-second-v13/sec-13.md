# Second 13 — original frames 390-419

_2/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase ambient occlusion intensity and shadow map resolution to resolve the floating appearance of elements, and adjust the white balance of the light sources to correct the cool color cast.

## Verified / surviving claims
### [sev 4] lighting @ t=13.50s — 2/2 runs — **MEASURED ✓**
- **A:** Soft contact shadows are visible under the cards and within the grid seams.
- **B:** The contact shadows are extremely faint or missing, making the elements appear to float.
- **Fix (advisory):** Increase ambient occlusion intensity and shadow map resolution.
- **Measurement:** {"p01":4.46,"p1":86.22,"p5":90.44,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.14,"span_p5_p95":141.03} vs {"p01":39.43,"p1":93.47,"p5":103.75,"p50":219.73,"p95":235.09,"p99":237.66,"p999":255,"span_p5_p95":131.34}

### [sev 3] color @ t=13.50s — 2/2 runs — **MEASURED ✓**
- **A:** The overall scene has a warm, cream-colored cast on the white surfaces.
- **B:** The scene has a neutral to cool white cast with higher brightness.
- **Fix (advisory):** Adjust the white balance of the light sources to introduce warmer tones.
- **Measurement:** {"r":194.53,"g":204.41,"b":200.72,"rb_delta":-6.2,"saturation":0.1862} vs {"r":195.07,"g":199.98,"b":221.75,"rb_delta":-26.68,"saturation":0.1955}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera depth of field and vignette to match the soft, focused look of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=14.20s — 2/3 runs — **MEASURED ✓**
- **A:** The background keys are heavily blurred due to a shallow depth of field.
- **B:** The background keys remain relatively sharp, indicating a deeper depth of field.
- **Fix (advisory):** Adjust camera aperture settings to increase depth of field blur in the background.
- **Measurement:** {"lap_var":0.83} vs {"lap_var":2.54}

## Killed in verification
### [sev 3] lighting @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners and edges.
- **B:** Flat lighting across the frame with minimal corner shading.
- **Fix (advisory):** Add a vignette to darken the corners and match the reference lighting.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":150.42,"center_mean":157.25,"falloff_pct":4.34}

### [sev 3] color @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow and blue keys display highly saturated, rich colors.
- **B:** The yellow and blue keys are desaturated and look washed out.
- **Fix (advisory):** Increase color saturation on the key materials to match the reference.
- **Measurement:** {"r":194.72,"g":204.52,"b":200.82,"rb_delta":-6.1,"saturation":0.1835} vs {"r":140.11,"g":153.42,"b":190,"rb_delta":-49.89,"saturation":0.3118}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

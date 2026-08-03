# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera's depth of field to match the reference's shallow focus, and enhance the ambient occlusion shadows around the card slots.

## Verified / surviving claims
### [sev 3] lighting @ t=5.20s — 2/3 runs — **MEASURED ✓**
- **A:** The shadow cast by the yellow Recurly tile is deep and well-defined.
- **B:** The shadow under the yellow Recurly tile is extremely faint and washed out.
- **Fix (advisory):** Adjust light sources to cast deeper shadows under the tiles.
- **Measurement:** {"p01":46.07,"p1":70.93,"p5":106.1,"p50":203.67,"p95":246.28,"p99":247.21,"p999":248.71,"span_p5_p95":140.18} vs {"p01":55.38,"p1":114.85,"p5":119.63,"p50":210.31,"p95":221.31,"p99":233.39,"p999":236.89,"span_p5_p95":101.68}

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are noticeably darker than the center, creating a strong vignette.
- **B:** The corners are nearly as bright as the center, lacking a vignette.
- **Fix (advisory):** Add a vignette to darken the corners of the frame.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":204.82,"center_mean":188.87,"falloff_pct":-8.45}

### [sev 2] color @ t=5.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Warm, golden-yellow color on the Recurly button.
- **B:** Cooler, greenish-yellow color on the Recurly button.
- **Fix (advisory):** Shift the yellow material color toward orange.
- **Measurement:** {"r":193.33,"g":198.58,"b":183.51,"rb_delta":9.82,"saturation":0.2015} vs {"r":201.09,"g":200.75,"b":189.05,"rb_delta":12.04,"saturation":0.2047}

### [sev 2] camera @ t=5.30s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Shallow depth of field with blurred background elements.
- **B:** Deep depth of field with sharp background elements.
- **Fix (advisory):** Adjust camera aperture to blur background.
- **Measurement:** {"lap_var":16.15} vs {"lap_var":3.6}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply the correct yellow and blue materials to the background, enable camera depth of field, and add a directional light source to cast soft drop shadows.

## Verified / surviving claims
### [sev 3] lighting @ t=3.50s — 2/3 runs — **MEASURED ✓**
- **A:** The cards cast soft, distinct drop shadows onto the background surface.
- **B:** The cards cast almost no visible drop shadows, appearing flat.
- **Fix (advisory):** Add a directional light source to cast soft drop shadows.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":72.64,"p1":96.41,"p5":172.14,"p50":195.86,"p95":218.37,"p99":220.37,"p999":254,"span_p5_p95":46.23}

### [sev 3] color @ t=3.50s — 2/3 runs — **MEASURED ✓**
- **A:** The top-left background block is bright yellow and card icons are vibrant blue.
- **B:** The top-left block is grey and card icons are desaturated, making the scene look monochromatic.
- **Fix (advisory):** Apply the correct yellow material to the background block and increase icon saturation.
- **Measurement:** {"r":189.85,"g":201.25,"b":211.47,"rb_delta":-21.62,"saturation":0.121} vs {"r":195.17,"g":195.88,"b":198.29,"rb_delta":-3.13,"saturation":0.0547}

## Killed in verification
### [sev 2] camera @ t=3.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Background elements in the corners show a soft depth-of-field blur.
- **B:** Background elements in the corners remain relatively sharp.
- **Fix (advisory):** Enable or strengthen depth of field to blur the background corners.
- **Measurement:** {"lap_var":37.06} vs {"lap_var":1.55}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

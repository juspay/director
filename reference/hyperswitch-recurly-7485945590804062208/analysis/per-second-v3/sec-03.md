# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply the correct blue and yellow materials to the background tiles to restore the color palette.

## Verified / surviving claims
### [sev 3] color @ t=3.50s — 2/3 runs — **MEASURED ✓**
- **A:** The surrounding tiles display vibrant blue and yellow colors.
- **B:** The surrounding tiles are plain white and grey.
- **Fix (advisory):** Assign the correct colored materials to the background tiles.
- **Measurement:** {"r":189.85,"g":201.25,"b":211.47,"rb_delta":-21.62,"saturation":0.121} vs {"r":189.24,"g":185.56,"b":184.25,"rb_delta":4.99,"saturation":0.0769}

### [sev 3] lighting @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** High contrast with bright highlights on the card surfaces and deep shadows in the crevices.
- **B:** Flat lighting with low contrast, washed-out shadows, and dull highlights.
- **Fix (advisory):** Adjust the light intensity and shadow bias to increase contrast and deepen shadows.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":16.97,"p1":17.4,"p5":145.92,"p50":184.49,"p95":230.77,"p99":233.77,"p999":238.06,"span_p5_p95":84.85}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

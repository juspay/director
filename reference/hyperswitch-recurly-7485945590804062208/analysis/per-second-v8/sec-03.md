# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust camera angle and focal length to match the dynamic perspective of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** The camera has a highly oblique perspective angle, showing the tiles tilted significantly relative to the frame.
- **B:** The camera is positioned more directly overhead, resulting in a flatter, less perspective-tilted view of the tiles.
- **Fix (advisory):** Adjust the camera angle and perspective/field-of-view to match the oblique angle of the reference.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":80.36,"p1":102.25,"p5":126.89,"p50":208.37,"p95":224.81,"p99":228.31,"p999":253.72,"span_p5_p95":97.92}

### [sev 2] staging @ t=3.20s — 3/3 runs — **MEASURED ✓**
- **A:** A yellow block is visible in the top-left corner of the frame.
- **B:** The top-left corner contains only plain white/grey tile surfaces with no yellow block.
- **Fix (advisory):** Add the yellow block element to the top-left area of the layout to match the reference staging.
- **Measurement:** {"r":188.24,"g":199.87,"b":209.83,"rb_delta":-21.59,"saturation":0.1229} vs {"r":197.08,"g":202.63,"b":216.24,"rb_delta":-19.16,"saturation":0.0869}

## Killed in verification
### [sev 2] lighting @ t=3.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Tiles cast distinct soft shadows to the right.
- **B:** Shadows are extremely faint, reducing depth.
- **Fix (advisory):** Adjust light angle and intensity for stronger shadows.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":80.36,"p1":102.25,"p5":126.89,"p50":208.37,"p95":224.81,"p99":228.31,"p999":253.72,"span_p5_p95":97.92}

## Present in A, absent in B (corroborated, unverified inventory)
- yellow_block

# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the key light direction and intensity to create stronger directional highlights and shadows.

## Verified / surviving claims
### [sev 3] lighting @ t=10.50s — 2/3 runs — **MEASURED ✓**
- **A:** Strong directional highlights are visible on the top-left bevels of the tiles and buttons, with deep shadows on the bottom-right.
- **B:** The lighting is highly diffuse with almost no directional highlights or shadows on the bevels, resulting in a flatter appearance.
- **Fix (advisory):** Adjust the key light direction and intensity to create stronger directional highlights and shadows.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":73.68,"p1":75.18,"p5":80.1,"p50":169.12,"p95":183.98,"p99":191.47,"p999":239.78,"span_p5_p95":103.88}

## Killed in verification
### [sev 2] color @ t=10.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow 'Recurly' button has a warm, golden-yellow hue, and the blue button is a highly saturated royal blue.
- **B:** The yellow button has a cooler, more desaturated lemon-yellow hue, and the blue button is less saturated.
- **Fix (advisory):** Adjust the color grading to increase saturation and shift the yellow hue towards a warmer golden tone.
- **Measurement:** {"r":193.13,"g":202.59,"b":205.46,"rb_delta":-12.33,"saturation":0.2203} vs {"r":141.75,"g":155.34,"b":192.96,"rb_delta":-51.2,"saturation":0.3454}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

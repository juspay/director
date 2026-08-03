# Second 4 — original frames 120-149

_2/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle and position in the Recurly shot to match the wider, high-angle composition of the reference.

## Verified / surviving claims
### [sev 4] camera @ t=4.95s — 2/2 runs — **MEASURED ✓**
- **A:** The camera angle is higher, showing the Recurly card alongside the Secure Payments card and the Success rate chart.
- **B:** The camera angle is lower and more skewed, focusing tightly on the Recurly card and cutting off surrounding elements.
- **Fix (advisory):** Adjust the camera angle and position to match the wider, high-angle composition.
- **Measurement:** {"lap_var":29.51} vs {"lap_var":5.36}

## Killed in verification
### [sev 3] lighting @ t=4.20s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows cast by the blocks are soft and highly diffused.
- **B:** The shadows are sharp and have high contrast.
- **Fix (advisory):** Increase the light source size to soften the shadows.
- **Measurement:** {"p01":61.48,"p1":75.73,"p5":123.54,"p50":207.73,"p95":246.31,"p99":249.29,"p999":251.15,"span_p5_p95":122.77} vs {"p01":62.75,"p1":96.55,"p5":171.16,"p50":213.16,"p95":237.82,"p99":239.67,"p999":253.85,"span_p5_p95":66.66}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

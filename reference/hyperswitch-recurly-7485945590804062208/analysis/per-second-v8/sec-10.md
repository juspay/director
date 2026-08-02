# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing to match the tight composition of the reference and deepen the shadows in the recessed slots.

## Verified / surviving claims
### [sev 3] camera @ t=10.50s — 2/3 runs — **MEASURED ✓**
- **A:** Camera is closer to the yellow card, creating a larger, more dynamic composition.
- **B:** Camera is further away, resulting in a smaller card and flatter composition.
- **Fix (advisory):** Match camera distance and angle to the reference.
- **Measurement:** {"lap_var":423.16} vs {"lap_var":37.1}

## Killed in verification
### [sev 3] lighting @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Crevices between the tiles have deep, dark shadows, providing strong contrast and depth.
- **B:** Crevices between the tiles are brightly lit with very shallow shadows, making the layout look flat.
- **Fix (advisory):** Adjust the ambient occlusion or shadow settings to deepen the crevices between tiles.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":89.96,"p1":90.96,"p5":97.73,"p50":194.31,"p95":212.16,"p99":216.72,"p999":239.72,"span_p5_p95":114.43}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

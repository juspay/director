# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 8 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase the shadow intensity and softness for the elevated tiles to match the depth of the reference.

## Verified / surviving claims
### [sev 2] lighting @ t=11.20s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly tile casts a distinct, soft drop shadow onto the recessed surface below it.
- **B:** The drop shadow under the yellow Recurly tile is almost non-existent, making it look flat against the background.
- **Fix (advisory):** Increase the shadow intensity and softness for the elevated tiles to match the depth of the reference.
- **Measurement:** {"p01":12.35,"p1":85.8,"p5":89.44,"p50":209.01,"p95":232.69,"p99":238.97,"p999":251.63,"span_p5_p95":143.25} vs {"p01":93.76,"p1":95.97,"p5":117.83,"p50":219.09,"p95":235.94,"p99":243.52,"p999":255,"span_p5_p95":118.11}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

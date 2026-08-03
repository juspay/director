# Second 3 — original frames 90-119

_2/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase the strength and radius of the ambient occlusion and contact shadows under the cards.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=3.50s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, soft contact shadows are visible beneath the raised cards, creating a strong sense of depth.
- **B:** The contact shadows beneath the cards are extremely faint, making the cards appear flat against the background.
- **Fix (advisory):** Increase the strength and radius of the ambient occlusion and contact shadows under the cards.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":76.52,"p1":101.26,"p5":122.41,"p50":202.74,"p95":219.18,"p99":221.18,"p999":251.71,"span_p5_p95":96.77}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 8 — original frames 240-269

_2/3 runs passed the ground-truth timing check; 12 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add stronger contact shadows around the tiles.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=8.30s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** Deep ambient occlusion shadows are visible in the tile crevices.
- **B:** Crevices are flatly lit with almost no contact shadows.
- **Fix (advisory):** Add stronger contact shadows around the tiles.
- **Measurement:** {"p01":45.71,"p1":86.53,"p5":104.03,"p50":180.57,"p95":244.44,"p99":248.86,"p999":250.51,"span_p5_p95":140.41} vs {"p01":52.79,"p1":54.3,"p5":59.94,"p50":192.67,"p95":213.8,"p99":234.81,"p999":255,"span_p5_p95":153.86}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

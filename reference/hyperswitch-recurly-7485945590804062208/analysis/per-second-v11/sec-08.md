# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase contact shadow intensity and ambient occlusion to deepen the crevices between the keys.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 4] lighting @ t=8.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong ambient occlusion shadows are visible in the crevices between the keys.
- **B:** Crevices are brightly lit with minimal contact shadows.
- **Fix (advisory):** Increase contact shadow intensity and ambient occlusion.
- **Measurement:** {"p01":42.84,"p1":86.54,"p5":101.16,"p50":180.58,"p95":242.72,"p99":246.19,"p999":250.36,"span_p5_p95":141.56} vs {"p01":54.5,"p1":55.5,"p5":60.4,"p50":154.42,"p95":189.55,"p99":215.31,"p999":254.79,"span_p5_p95":129.15}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

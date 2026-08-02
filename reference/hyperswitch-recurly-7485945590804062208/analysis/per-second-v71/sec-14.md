# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 1 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enable depth of field to match the reference's blur on background elements.

## Verified / surviving claims
### [sev 3] camera @ t=14.30s — 2/3 runs — **MEASURED ✓**
- **A:** Background tiles are blurred due to depth of field.
- **B:** Background tiles are sharp and in focus.
- **Fix (advisory):** Enable depth of field.
- **Measurement:** {"lap_var":0.87} vs {"lap_var":2.96}

## Killed in verification
### [sev 2] lighting @ t=14.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Crevices between tiles have deep contact shadows.
- **B:** Crevices between tiles have faint shadows.
- **Fix (advisory):** Deepen the contact shadows.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":61.58,"p1":62.37,"p5":67.52,"p50":192.37,"p95":211.67,"p99":215.74,"p999":239.59,"span_p5_p95":144.15}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

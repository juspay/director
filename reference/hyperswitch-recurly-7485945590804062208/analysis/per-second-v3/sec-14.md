# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add a vignette effect and increase contact shadow depth to match the reference lighting.

## Verified / surviving claims
### [sev 3] lighting @ t=14.20s — 3/3 runs — **MEASURED ✓**
- **A:** Deep, soft contact shadows beneath the cards.
- **B:** Faint contact shadows, making cards appear flat.
- **Fix (advisory):** Increase shadow intensity and ambient occlusion.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":98.5,"p1":99.8,"p5":118.2,"p50":224.28,"p95":238,"p99":238.43,"p999":239.93,"span_p5_p95":119.8}

## Killed in verification
### [sev 3] lighting @ t=14.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Distinct dark vignette in the corners of the frame.
- **B:** Corners are bright white with no vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":225,"center_mean":203.46,"falloff_pct":-10.59}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

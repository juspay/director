# Second 4 — original frames 120-149

_2/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the lighting setup to introduce a stronger vignette and deeper shadows under the cards to match the reference's depth and contrast.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=4.20s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with pronounced corner shading and warm light falloff.
- **B:** Flat, uniform lighting across the frame with minimal corner falloff.
- **Fix (advisory):** Add a vignette and adjust light falloff to match the reference.
- **Measurement:** {"corner_mean":202.05,"center_mean":199.03,"falloff_pct":-1.52} vs {"corner_mean":173.53,"center_mean":200.92,"falloff_pct":13.63}

### [sev 2] lighting @ t=4.95s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** The shadow underneath the yellow Recurly card is deep and dark, creating strong contrast.
- **B:** The shadow underneath the yellow Recurly card is very light and faint.
- **Fix (advisory):** Increase the shadow intensity or ambient occlusion under the yellow card to improve contrast.
- **Measurement:** {"p01":36.12,"p1":81.87,"p5":136.22,"p50":205.67,"p95":246.28,"p99":247.13,"p999":249.72,"span_p5_p95":110.06} vs {"p01":36.82,"p1":47.93,"p5":54.22,"p50":193.53,"p95":207.81,"p99":216.26,"p999":218.68,"span_p5_p95":153.59}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

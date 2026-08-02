# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enable camera depth of field to match the reference blur in the background and increase shadow density under the cards.

## Verified / surviving claims
### [sev 3] camera @ t=12.20s — 2/3 runs — **MEASURED ✓**
- **A:** Background tiles in corners are heavily blurred by shallow depth of field.
- **B:** Background tiles in corners are in sharp focus.
- **Fix (advisory):** Enable camera depth of field and adjust aperture.
- **Measurement:** {"lap_var":0.91} vs {"lap_var":3.21}

## Killed in verification
### [sev 3] lighting @ t=12.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, defined shadows beneath the cards provide depth.
- **B:** Faint, diffuse shadows make the cards look flat.
- **Fix (advisory):** Increase shadow density and ambient occlusion.
- **Measurement:** {"p01":4.04,"p1":86.3,"p5":91.09,"p50":208.88,"p95":231.19,"p99":236.33,"p999":252.45,"span_p5_p95":140.1} vs {"p01":61.86,"p1":62.37,"p5":67.52,"p50":192.81,"p95":211.72,"p99":215.72,"p999":239.5,"span_p5_p95":144.2}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

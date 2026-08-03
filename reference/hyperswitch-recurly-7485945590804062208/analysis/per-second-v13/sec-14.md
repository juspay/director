# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add a volumetric fog or glow overlay to match the high-key lighting of the reference.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 2] lighting @ t=14.00s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** There is a stronger vignette with darker corners.
- **B:** The lighting is more uniform with a weaker vignette.
- **Fix (advisory):** Increase the vignette strength.
- **Measurement:** {"corner_mean":208.79,"center_mean":192.7,"falloff_pct":-8.35} vs {"corner_mean":202.8,"center_mean":193.03,"falloff_pct":-5.06}

### [sev 3] lighting @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene is covered in a bright volumetric glow that softens shadows and washes out background details.
- **B:** The scene lacks this volumetric glow, showing sharp shadows and high-contrast background tiles.
- **Fix (advisory):** Add a volumetric fog or glow overlay to match the high-key lighting of the reference.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":39.44,"p1":93.47,"p5":103.75,"p50":220.09,"p95":235.09,"p99":237.66,"p999":255,"span_p5_p95":131.34}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Warm up the lighting to match the reference and soften the shadows under the yellow tile.

## Verified / surviving claims
### [sev 3] color @ t=10.50s — 3/3 runs — **MEASURED ✓**
- **A:** The scene has a warm, cream-colored lighting cast.
- **B:** The scene has a cooler, neutral gray lighting cast.
- **Fix (advisory):** Warm up the lighting to match the reference.
- **Measurement:** {"r":193.29,"g":203.73,"b":201.96,"rb_delta":-8.67,"saturation":0.191} vs {"r":199.79,"g":203.53,"b":223.51,"rb_delta":-23.72,"saturation":0.1719}

## Killed in verification
### [sev 3] lighting @ t=10.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadow under the yellow tile is soft and diffused.
- **B:** The shadow is sharp and extremely dark, creating harsh contrast.
- **Fix (advisory):** Increase the light source size to soften the shadows.
- **Measurement:** {"p01":8.56,"p1":87.08,"p5":91.29,"p50":208.73,"p95":230.27,"p99":237.33,"p999":250.87,"span_p5_p95":138.98} vs {"p01":93.76,"p1":95.97,"p5":117.37,"p50":219.09,"p95":235.94,"p99":243.94,"p999":255,"span_p5_p95":118.57}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add a vignette and deepen the shadows in B to match the contrast and framing of Video A.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=9.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the image are significantly darker than the center, showing a strong vignette.
- **B:** The corners are almost as bright as the center, lacking a vignette.
- **Fix (advisory):** Add a vignette effect in post-processing.
- **Measurement:** {"corner_mean":203.26,"center_mean":200.61,"falloff_pct":-1.32} vs {"corner_mean":154.78,"center_mean":157.31,"falloff_pct":1.61}

### [sev 3] lighting @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The crevices between the keys have deep, dark shadows, creating high contrast.
- **B:** The crevices have light grey shadows, resulting in a flatter image.
- **Fix (advisory):** Deepen the shadows and increase overall contrast.
- **Measurement:** {"p01":62.41,"p1":94.19,"p5":107.96,"p50":202.15,"p95":246.35,"p99":249.79,"p999":253,"span_p5_p95":138.39} vs {"p01":62.37,"p1":63.51,"p5":69.7,"p50":172.69,"p95":190.69,"p99":194.77,"p999":245.8,"span_p5_p95":120.99}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

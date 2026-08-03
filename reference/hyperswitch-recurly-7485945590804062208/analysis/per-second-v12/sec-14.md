# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust ambient occlusion and shadow settings to deepen crevices, and apply a stronger vignette effect in post-processing.

## Verified / surviving claims
### [sev 3] lighting @ t=14.20s — 2/3 runs — **MEASURED ✓**
- **A:** Crevices between tiles show deep, high-contrast shadows.
- **B:** Crevices have faint shadows, making the layout look flat.
- **Fix (advisory):** Adjust ambient occlusion and shadow settings to deepen crevices.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":93.76,"p1":95.9,"p5":120.05,"p50":218.73,"p95":235.45,"p99":242.59,"p999":255,"span_p5_p95":115.4}

## Killed in verification
### [sev 2] lighting @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignetting is visible, darkening the corners of the frame.
- **B:** The corners are bright, indicating a lack of vignette falloff.
- **Fix (advisory):** Apply a stronger vignette effect in post-processing.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":196.73,"center_mean":195.95,"falloff_pct":-0.4}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase shadow density and ambient occlusion in the gaps.

## Verified / surviving claims
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASURED ✓**
- **A:** Deep shadows are visible in the gaps between the tiles, creating high contrast.
- **B:** Shadows in the tile gaps are extremely faint and bright.
- **Fix (advisory):** Increase shadow density and ambient occlusion in the gaps.
- **Measurement:** {"p01":39.32,"p1":48.22,"p5":71.15,"p50":184.79,"p95":231.71,"p99":240.07,"p999":248.15,"span_p5_p95":160.56} vs {"p01":2.07,"p1":26.67,"p5":128.18,"p50":191.78,"p95":220.63,"p99":221.63,"p999":221.77,"span_p5_p95":92.45}

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** A strong vignette is present, darkening the corners of the frame significantly.
- **B:** The vignette is absent, leaving the corners as bright as the center.
- **Fix (advisory):** Add a vignette post-process to match the corner falloff.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":209.17,"center_mean":185.58,"falloff_pct":-12.71}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

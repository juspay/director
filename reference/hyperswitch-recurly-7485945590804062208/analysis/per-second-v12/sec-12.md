# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enable camera depth of field and adjust the aperture to blur background elements.

## Verified / surviving claims
### [sev 4] camera @ t=12.20s — 2/3 runs — **MEASURED ✓**
- **A:** The background elements in the upper right corner are out of focus.
- **B:** The background elements in the upper right corner are sharp and in focus.
- **Fix (advisory):** Enable camera depth of field and adjust the aperture to blur background elements.
- **Measurement:** {"lap_var":0.91} vs {"lap_var":4.21}

## Killed in verification
### [sev 3] lighting @ t=12.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignette with darker corners.
- **B:** Brighter corners with minimal vignette.
- **Fix (advisory):** Apply a stronger vignette effect in post-processing.
- **Measurement:** {"corner_mean":209.43,"center_mean":194.03,"falloff_pct":-7.93} vs {"corner_mean":204.09,"center_mean":193.02,"falloff_pct":-5.73}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing and focal length to match the reference.

## Verified / surviving claims
### [sev 3] camera @ t=5.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera framing is tighter on the yellow card.
- **B:** The camera framing is wider, showing more background elements.
- **Fix (advisory):** Adjust camera position or focal length for tighter framing.
- **Channel B:** Clip A shows a tighter framing on the yellow 'Recurly' card, with surrounding elements like 'Secure Payments' partially cut off. Clip B shows a wider framing, revealing more of the surrounding white tiles and background elements.

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows cast by the yellow button are soft and diffuse.
- **B:** The shadows are sharp with hard, dark edges.
- **Fix (advisory):** Increase the light source size to soften the contact shadows.
- **Measurement:** {"p01":46.59,"p1":73.79,"p5":101.22,"p50":202.47,"p95":246,"p99":247,"p999":248.42,"span_p5_p95":144.78} vs {"p01":2.98,"p1":75.13,"p5":103.63,"p50":202.67,"p95":213.09,"p99":223.68,"p999":232.04,"span_p5_p95":109.46}

### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong corner shading is visible, creating a clear vignette.
- **B:** The frame corners are bright, lacking any vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":197.4,"center_mean":180.76,"falloff_pct":-9.2}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enhance the ambient occlusion shadows in the crevices and apply a stronger vignette to recreate the soft, high-depth 3D aesthetic of the reference.

## Verified / surviving claims
### [sev 2] color @ t=12.20s — 2/3 runs — **MEASURED ✓**
- **A:** Warm, neutral white keys and vibrant colors.
- **B:** Cool, bluish-grey color cast on white keys.
- **Fix (advisory):** Adjust white balance to reduce the blue tint.
- **Measurement:** {"r":194.49,"g":204.8,"b":200.59,"rb_delta":-6.1,"saturation":0.1879} vs {"r":140.14,"g":153.36,"b":189.69,"rb_delta":-49.54,"saturation":0.3119}

## Killed in verification
### [sev 2] lighting @ t=12.00s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners.
- **B:** Weak vignette with bright corners.
- **Fix (advisory):** Add a vignette to darken the corners.
- **Measurement:** {"corner_mean":209.42,"center_mean":198.09,"falloff_pct":-5.72} vs {"corner_mean":149.05,"center_mean":156.06,"falloff_pct":4.49}

### [sev 3] lighting @ t=12.80s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep ambient occlusion shadows are visible in the crevices between the keycaps.
- **B:** The crevices are brightly lit with very weak contact shadows.
- **Fix (advisory):** Increase ambient occlusion intensity and add contact shadows between the keys.
- **Measurement:** {"p01":3.61,"p1":85.8,"p5":89.02,"p50":208.88,"p95":231.19,"p99":236.33,"p999":252.24,"span_p5_p95":142.17} vs {"p01":73.68,"p1":74.97,"p5":80.1,"p50":170.05,"p95":183.05,"p99":188.59,"p999":239.5,"span_p5_p95":102.95}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

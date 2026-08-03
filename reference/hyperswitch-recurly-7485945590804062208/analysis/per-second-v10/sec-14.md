# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply a warm color grade and add a vignette effect to match the reference, while enhancing the contact shadows under the buttons to restore depth.

## Verified / surviving claims
### [sev 4] color @ t=14.10s — 2/3 runs — **MEASURED ✓**
- **A:** Warm, yellowish color cast on white surfaces.
- **B:** Neutral grey and white surfaces with no color cast.
- **Fix (advisory):** Apply a warm color grade to match the reference.
- **Measurement:** {"r":194.63,"g":204.43,"b":200.75,"rb_delta":-6.12,"saturation":0.184} vs {"r":139.51,"g":152.82,"b":189.41,"rb_delta":-49.9,"saturation":0.3127}

## Killed in verification
### [sev 4] lighting @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners.
- **B:** Weak vignette with bright corners.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":150.43,"center_mean":155.68,"falloff_pct":3.37}

### [sev 3] lighting @ t=14.10s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, soft contact shadows are visible beneath the raised button elements, creating a strong sense of depth.
- **B:** The contact shadows are extremely faint, making the buttons appear flat and un-raised.
- **Fix (advisory):** Enhance the ambient occlusion and contact shadow intensity under the buttons.
- **Measurement:** {"p01":4.25,"p1":85.88,"p5":91.13,"p50":208.87,"p95":231.47,"p99":236.19,"p999":251.81,"span_p5_p95":140.34} vs {"p01":73.12,"p1":74.68,"p5":79.82,"p50":168.69,"p95":182.41,"p99":188.77,"p999":239.72,"span_p5_p95":102.59}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

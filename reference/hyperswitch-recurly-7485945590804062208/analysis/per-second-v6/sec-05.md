# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position, focal length, and depth of field to match the close-up perspective of the reference, and correct the yellow card's color saturation.

## Verified / surviving claims
### [sev 3] lighting @ t=5.20s — 2/3 runs — **MEASURED ✓**
- **A:** Strong vignette with darker corners.
- **B:** Flat, uniform lighting across the frame.
- **Fix (advisory):** Add a vignette to match the reference lighting falloff.
- **Measurement:** {"corner_mean":195.2,"center_mean":181.33,"falloff_pct":-7.65} vs {"corner_mean":188.74,"center_mean":161.88,"falloff_pct":-16.6}

## Killed in verification
### [sev 3] color @ t=5.30s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Warm, highly saturated golden yellow card.
- **B:** Cooler, less saturated pale yellow card.
- **Fix (advisory):** Adjust the yellow material's color temperature and saturation.
- **Measurement:** {"r":192.89,"g":198.02,"b":181.63,"rb_delta":11.26,"saturation":0.2025} vs {"r":183.27,"g":183.33,"b":165.01,"rb_delta":18.26,"saturation":0.2189}

### [sev 3] camera @ t=5.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned close to the yellow Recurly card, creating a dynamic perspective with visible depth of field blur in the background.
- **B:** The camera is positioned further away, showing more of the surrounding white tiles with less perspective distortion and a deeper depth of field.
- **Fix (advisory):** Adjust the camera focal length and position to match the close-up perspective and shallow depth of field of the reference.
- **Measurement:** {"lap_var":18.21} vs {"lap_var":4.7}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

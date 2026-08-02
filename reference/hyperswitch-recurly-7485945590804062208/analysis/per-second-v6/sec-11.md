# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera distance and focal length to match the tighter, dynamic perspective of the reference, and apply a vignette with stronger ambient shadows to restore depth.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=11.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is at a low, dramatic angle with perspective depth.
- **B:** The camera is at a flatter, more top-down angle with less perspective.
- **Fix (advisory):** Match the camera's low angle and focal length.
- **Measurement:** {"p01":12.35,"p1":85.8,"p5":89.44,"p50":209.01,"p95":232.69,"p99":238.97,"p999":251.63,"span_p5_p95":143.25} vs {"p01":60.86,"p1":61.43,"p5":67.66,"p50":191.8,"p95":207.74,"p99":211.37,"p999":237.43,"span_p5_p95":140.08}

### [sev 3] lighting @ t=11.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong corner vignette and soft ambient shadows around the cards create depth.
- **B:** Flat, uniform lighting across the frame with minimal vignette and weak shadows.
- **Fix (advisory):** Add a vignette and enable high-quality ambient occlusion or contact shadows.
- **Measurement:** {"corner_mean":209.75,"center_mean":196.45,"falloff_pct":-6.77} vs {"corner_mean":182.21,"center_mean":174.16,"falloff_pct":-4.62}

### [sev 2] color @ t=11.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow and blue cards display highly saturated, vibrant colors.
- **B:** The colors on the cards appear desaturated and washed out.
- **Fix (advisory):** Increase the saturation and adjust the color grading to match the reference's vibrancy.
- **Measurement:** {"r":193.46,"g":203.74,"b":200.33,"rb_delta":-6.87,"saturation":0.1922} vs {"r":167.69,"g":174.41,"b":182.69,"rb_delta":-15.01,"saturation":0.192}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

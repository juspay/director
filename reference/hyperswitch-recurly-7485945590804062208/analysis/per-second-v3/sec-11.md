# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera focal length to match the perspective and apply a cooler color grade with a vignette.

## Verified / surviving claims
### [sev 3] color @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** The white background tiles have a distinct cool blue color cast.
- **B:** The white background tiles are neutral grey/warm off-white.
- **Fix (advisory):** Adjust color temperature to introduce a cool blue cast.
- **Measurement:** {"r":193.46,"g":203.74,"b":200.33,"rb_delta":-6.87,"saturation":0.1922} vs {"r":213.48,"g":212.6,"b":210.12,"rb_delta":3.37,"saturation":0.1008}

### [sev 3] lighting @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** Pronounced darkening at the corners of the frame.
- **B:** Uniform brightness across the frame with minimal corner falloff.
- **Fix (advisory):** Add a vignette to match the reference lighting.
- **Measurement:** {"corner_mean":209.75,"center_mean":196.45,"falloff_pct":-6.77} vs {"corner_mean":228,"center_mean":202.4,"falloff_pct":-12.65}

## Killed in verification
### [sev 3] camera @ t=11.80s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** Strong perspective distortion on the cards due to a wider field of view.
- **B:** Flatter perspective with less distortion, indicating a longer focal length.
- **Fix (advisory):** Adjust camera focal length to match the perspective.
- **Channel B:** The claim is reversed. Clip A shows flat, 2D-like cards with no perspective distortion, while Clip B shows 3D cards and blocks with visible depth and perspective.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

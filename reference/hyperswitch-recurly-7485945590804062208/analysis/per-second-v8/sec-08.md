# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 1 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera field of view and distance to match the dynamic perspective, and add a vignette to correct the flat lighting.

## Verified / surviving claims
### [sev 3] color @ t=8.50s — 2/3 runs — **MEASURED ✓**
- **A:** The Recurly card features a warm, highly saturated golden yellow.
- **B:** The Recurly card features a cooler, less saturated pale yellow.
- **Fix (advisory):** Adjust the diffuse color of the Recurly card to a warmer, more saturated yellow.
- **Measurement:** {"r":168.23,"g":177.79,"b":186.98,"rb_delta":-18.75,"saturation":0.2316} vs {"r":169.47,"g":177.06,"b":192.01,"rb_delta":-22.55,"saturation":0.2114}

## Killed in verification
### [sev 3] camera @ t=8.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned close to the cards, creating a tight composition with a distinct low-angle perspective.
- **B:** The camera is positioned further away, resulting in a loose composition with a flatter, more top-down perspective.
- **Fix (advisory):** Adjust camera position and focal length to match the tight, low-angle perspective of Video A.
- **Measurement:** {"corner_mean":174.81,"center_mean":180.43,"falloff_pct":3.11} vs {"corner_mean":177.19,"center_mean":187.06,"falloff_pct":5.27}

### [sev 3] lighting @ t=8.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette darkening the corners of the frame.
- **B:** Flat, uniform lighting across the frame with no vignette.
- **Fix (advisory):** Add a vignette in post-production to match the reference falloff.
- **Measurement:** {"corner_mean":174.81,"center_mean":180.43,"falloff_pct":3.11} vs {"corner_mean":177.19,"center_mean":187.06,"falloff_pct":5.27}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

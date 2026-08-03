# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing and angle to match the reference, and significantly deepen the contact shadows to restore the 3D depth of the scene.

## Verified / surviving claims
### [sev 3] camera @ t=8.00s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera is close to the JUSPAY card with a top-down angle, making it fill most of the frame.
- **B:** The camera is further away and tilted at a steep oblique angle, showing more of the surrounding tiles.
- **Fix (advisory):** Adjust the camera position and tilt to match the reference framing.
- **Channel B:** The claim accurately describes the camera framing and angles in both clips. Clip A shows a close-up, nearly top-down view of the JUSPAY card, while Clip B shows a wider, highly oblique angle that reveals more of the surrounding tiles.

### [sev 3] lighting @ t=8.50s — 2/3 runs — **MEASURED ✓**
- **A:** The image has a prominent vignette with darker corners.
- **B:** The image has a very weak vignette with bright corners.
- **Fix (advisory):** Increase the vignette strength to match the reference.
- **Measurement:** {"corner_mean":174.81,"center_mean":180.43,"falloff_pct":3.11} vs {"corner_mean":164.58,"center_mean":157.24,"falloff_pct":-4.67}

## Killed in verification
### [sev 3] lighting @ t=8.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The cards cast deep, soft contact shadows onto the white background tiles, creating depth.
- **B:** The contact shadows are extremely faint and washed out, making the cards look flat.
- **Fix (advisory):** Increase shadow density and adjust the light source to cast stronger contact shadows.
- **Measurement:** {"p01":42.84,"p1":86.54,"p5":101.16,"p50":180.58,"p95":242.72,"p99":246.19,"p999":250.36,"span_p5_p95":141.56} vs {"p01":1.28,"p1":46.57,"p5":58.88,"p50":172.12,"p95":206.55,"p99":252.02,"p999":255,"span_p5_p95":147.67}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

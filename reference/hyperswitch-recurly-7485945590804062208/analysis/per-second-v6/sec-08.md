# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing and position after the cut to match the close-up perspective of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=8.30s — 2/3 runs — **MEASURED ✓**
- **A:** The camera is close to the cards, creating a shallow depth of field and dynamic perspective.
- **B:** The camera is far away, showing a flat, wide-angle view of the grid layout.
- **Fix (advisory):** Adjust camera position and focal length to match the close-up perspective.
- **Measurement:** {"lap_var":135.28} vs {"lap_var":29.4}

### [sev 2] color @ t=8.50s — 3/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly card is highly saturated and vibrant.
- **B:** The yellow Recurly card is pale and desaturated.
- **Fix (advisory):** Increase saturation on the yellow card material.
- **Measurement:** {"r":168.23,"g":177.79,"b":186.98,"rb_delta":-18.75,"saturation":0.2316} vs {"r":167.8,"g":172.7,"b":180.15,"rb_delta":-12.35,"saturation":0.1986}

### [sev 3] motion @ t=8.60s — 2/3 runs — **MEASURED ✓**
- **A:** The 'Live Now' button rises vertically from its slot.
- **B:** The 'Live Now' button is static and already resting on the surface.
- **Fix (advisory):** Animate the button to rise up from the slot.
- **Measurement:** {"mean_abs_delta":3.7387,"frames":30} vs {"mean_abs_delta":0.6422,"frames":30}

## Killed in verification
### [sev 3] lighting @ t=8.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong contact shadows are visible beneath the cards, creating depth.
- **B:** Shadows are extremely faint, making the cards look flat.
- **Fix (advisory):** Increase contact shadow intensity and ambient occlusion.
- **Measurement:** {"p01":42.84,"p1":86.54,"p5":101.16,"p50":180.58,"p95":242.72,"p99":246.19,"p999":250.36,"span_p5_p95":141.56} vs {"p01":48.07,"p1":50.21,"p5":55.93,"p50":189.8,"p95":208.28,"p99":224.08,"p999":253.57,"span_p5_p95":152.35}

## Present in A, absent in B (corroborated, unverified inventory)
- button animation

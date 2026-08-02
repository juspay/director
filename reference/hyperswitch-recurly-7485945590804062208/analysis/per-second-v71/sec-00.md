# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position, angle, and focal length to match the close-up, dynamic framing of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=0.10s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera is positioned close to the 'Secure Payments' tile, creating a tight macro composition.
- **B:** The camera is further away, resulting in a wider shot with different tile perspective.
- **Fix (advisory):** Adjust camera distance and field of view to match the reference close-up.
- **Channel B:** The comparison is accurate. Clip A shows a tight macro shot of the 'Secure Payments' tile, while Clip B shows a wider shot from a further distance and a different angle.

### [sev 3] lighting @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** Bright white highlights on keys with distinct soft shadows.
- **B:** Dull greyish highlights and flatter overall contrast.
- **Fix (advisory):** Adjust lighting and luma curve to increase contrast.
- **Measurement:** {"p01":54.96,"p1":75.83,"p5":98.57,"p50":207.67,"p95":236.6,"p99":249.51,"p999":252.01,"span_p5_p95":138.03} vs {"p01":69.74,"p1":94.78,"p5":125.89,"p50":201.8,"p95":218.67,"p99":220.82,"p999":223.68,"span_p5_p95":92.78}

### [sev 2] color @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** The blue shield icon has high color saturation.
- **B:** The blue shield icon is less saturated and slightly desaturated.
- **Fix (advisory):** Increase saturation of the blue material.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":188.44,"g":194.95,"b":209.61,"rb_delta":-21.18,"saturation":0.1007}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

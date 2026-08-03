# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Match the camera angle and perspective to Video A, and soften the harsh shadows under the yellow button.

## Verified / surviving claims
### [sev 3] lighting @ t=6.80s — 2/3 runs — **MEASURED ✓**
- **A:** Corners of the frame are darker than the center, showing a strong vignette.
- **B:** Lighting is uniform across the frame with no vignette.
- **Fix (advisory):** Add a vignette in post-processing.
- **Measurement:** {"corner_mean":199.46,"center_mean":124.66,"falloff_pct":-60} vs {"corner_mean":192.7,"center_mean":92.62,"falloff_pct":-108.05}

### [sev 3] camera @ t=6.25s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** Camera is at a low oblique angle with strong perspective distortion on the yellow button.
- **B:** Camera is at a higher, flatter angle with less perspective distortion.
- **Fix (advisory):** Match camera pitch and focal length to Video A.
- **Channel B:** Clip A shows the yellow button from a lower, more dramatic oblique angle, resulting in stronger perspective distortion. Clip B shows the button from a higher, more top-down angle, which reduces the perspective distortion and makes the button appear flatter.

## Killed in verification
### [sev 3] lighting @ t=6.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadow cast by the yellow Recurly button is soft and diffused.
- **B:** The shadow cast by the yellow Recurly button is extremely dark and hard-edged.
- **Fix (advisory):** Increase the size of the light source or adjust shadow blur settings to soften the shadow edges.
- **Measurement:** {"p01":47.93,"p1":70.57,"p5":102.59,"p50":206.64,"p95":245.55,"p99":246.7,"p999":248.37,"span_p5_p95":142.96} vs {"p01":9.2,"p1":97.98,"p5":104.49,"p50":202.38,"p95":211.81,"p99":217.4,"p999":227.19,"span_p5_p95":107.32}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

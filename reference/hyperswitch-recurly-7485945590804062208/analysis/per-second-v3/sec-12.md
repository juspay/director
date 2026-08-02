# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Reposition the camera closer to the cards at a dynamic angle, enable depth of field, and adjust the lighting to create deep, soft shadows that emphasize the 3D layout.

## Verified / surviving claims
### [sev 3] camera @ t=12.20s — 3/3 runs — **MEASURED ✓**
- **A:** The camera is close to the cards at an angle with shallow depth of field, blurring the background.
- **B:** The camera is far away at a high angle with deep depth of field, keeping everything sharp.
- **Fix (advisory):** Reposition the camera closer, match the angled perspective, and enable depth of field.
- **Measurement:** {"lap_var":0.91} vs {"lap_var":3.06}

### [sev 3] lighting @ t=12.50s — 3/3 runs — **MEASURED ✓**
- **A:** Strong directional lighting creates deep, soft shadows between the raised cards.
- **B:** Flat, ambient lighting results in very faint shadows, making the cards appear flat.
- **Fix (advisory):** Add a strong directional light source and adjust shadow settings to deepen shadows.
- **Measurement:** {"p01":4.04,"p1":86.3,"p5":91.09,"p50":208.88,"p95":231.19,"p99":236.33,"p999":252.45,"span_p5_p95":140.1} vs {"p01":97.09,"p1":99.8,"p5":110.41,"p50":224.28,"p95":238,"p99":238.43,"p999":239.87,"span_p5_p95":127.59}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

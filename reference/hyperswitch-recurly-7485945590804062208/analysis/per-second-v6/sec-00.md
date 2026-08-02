# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position and focal length to match the close-up framing and depth of field of the reference video.

## Verified / surviving claims
### [sev 3] color @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** Vibrant, highly saturated blue and yellow keys.
- **B:** Desaturated, greyish keys with pale colors.
- **Fix (advisory):** Increase saturation and match the color palette.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":193.65,"g":194.78,"b":196.53,"rb_delta":-2.88,"saturation":0.0394}

### [sev 3] lighting @ t=0.50s — 2/3 runs — **MEASURED ✓**
- **A:** The scene has high contrast with bright highlights on the tiles and deep shadows in the crevices.
- **B:** The scene is flatly lit with low contrast and washed-out shadows.
- **Fix (advisory):** Increase the light intensity and adjust the shadow settings to create higher contrast and deeper shadows.
- **Measurement:** {"p01":54.96,"p1":75.83,"p5":98.57,"p50":207.67,"p95":236.6,"p99":249.51,"p999":252.01,"span_p5_p95":138.03} vs {"p01":68.94,"p1":98.57,"p5":153.43,"p50":199.08,"p95":216.09,"p99":217.8,"p999":220.8,"span_p5_p95":62.66}

## Killed in verification
### [sev 3] camera @ t=0.10s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Tight close-up on the Secure Payments card with blurred background.
- **B:** Zoomed-out wide view of multiple cards, all in sharp focus.
- **Fix (advisory):** Move camera closer and enable depth of field.
- **Measurement:** {"lap_var":34.87} vs {"lap_var":1.56}

## Present in A, absent in B (corroborated, unverified inventory)
- blue and yellow tiles/keys

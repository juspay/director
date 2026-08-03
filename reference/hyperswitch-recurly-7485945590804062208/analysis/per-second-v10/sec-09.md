# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position and focal length to match the closer framing of the reference, and increase ambient occlusion shadows and vignette to restore depth.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=9.00s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned closer to the buttons, creating a tighter composition.
- **B:** The camera is positioned further back, showing more of the surrounding tiles.
- **Fix (advisory):** Move the camera closer to match the reference framing.
- **Measurement:** {"corner_mean":199.3,"center_mean":197.21,"falloff_pct":-1.06} vs {"corner_mean":150.52,"center_mean":150.82,"falloff_pct":0.2}

### [sev 3] lighting @ t=9.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene features high-contrast lighting with deep shadows between keys and a strong vignette.
- **B:** The scene has flat, uniform lighting with bright shadows and no vignette.
- **Fix (advisory):** Increase contrast, deepen shadows, and add a vignette.
- **Measurement:** {"p01":64.55,"p1":93.67,"p5":106.9,"p50":201.47,"p95":246.09,"p99":249.72,"p999":252.72,"span_p5_p95":139.19} vs {"p01":58.43,"p1":59.08,"p5":62.65,"p50":171.42,"p95":194.05,"p99":203.89,"p999":249.86,"span_p5_p95":131.4}

### [sev 2] color @ t=9.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow Recurly card has a warm, saturated golden-yellow hue.
- **B:** The yellow Recurly card has a cooler, slightly greenish-yellow hue.
- **Fix (advisory):** Adjust the color of the yellow card to be warmer and more saturated.
- **Measurement:** {"r":194.9,"g":201.3,"b":210.54,"rb_delta":-15.64,"saturation":0.1976} vs {"r":140.62,"g":155.74,"b":196.48,"rb_delta":-55.86,"saturation":0.3721}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enhance the material properties of the buttons to include specular reflections and apply a vignette to the camera to match the depth and realism of Video A.

## Verified / surviving claims
### [sev 2] color @ t=12.50s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow button has a warm, golden color cast.
- **B:** The yellow button has a cooler, greenish-yellow color cast.
- **Fix (advisory):** Adjust the color temperature of the yellow material to be warmer.
- **Measurement:** {"r":193.72,"g":203.82,"b":200.11,"rb_delta":-6.38,"saturation":0.1905} vs {"r":139.51,"g":152.75,"b":189.16,"rb_delta":-49.65,"saturation":0.3128}

## Killed in verification
### [sev 3] lighting @ t=12.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The frame corners show a distinct dark vignette falloff.
- **B:** The frame corners are as bright as the center, lacking a vignette.
- **Fix (advisory):** Apply a vignette effect in post-production.
- **Measurement:** {"corner_mean":209.43,"center_mean":194.03,"falloff_pct":-7.93} vs {"corner_mean":149.36,"center_mean":154.64,"falloff_pct":3.42}

### [sev 3] material @ t=12.00s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow Recurly button displays a soft gradient and subtle specular highlights.
- **B:** The yellow Recurly button has a flat, solid color with no specular reflections.
- **Fix (advisory):** Add a glossy shader with roughness to the yellow button material.
- **Measurement:** {"p01":1.78,"p1":180.48,"p5":182.4,"p50":208.59,"p95":232.47,"p99":236.68,"p999":240.32,"span_p5_p95":50.07} vs {"p01":78.25,"p1":95.98,"p5":102.7,"p50":171.69,"p95":185.05,"p99":186.05,"p999":240.14,"span_p5_p95":82.35}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

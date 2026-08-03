# Second 9 — original frames 270-299

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the grid layout to correct the staging of the yellow Recurly button, and soften the button shadows to match the reference.

## Verified / surviving claims
### [sev 2] color @ t=9.00s — 1/1 runs — **MEASURED ✓**
- **A:** The white tiles have a warm, cream-colored tone.
- **B:** The white tiles are neutral white with a cooler, bluish-gray cast.
- **Fix (advisory):** Adjust the color temperature to be warmer.
- **Measurement:** {"r":184.19,"g":194.27,"b":202.17,"rb_delta":-17.97,"saturation":0.1887} vs {"r":170.71,"g":178.91,"b":206.76,"rb_delta":-36.05,"saturation":0.2514}

## Killed in verification
### [sev 3] staging @ t=9.00s — 1/1 runs — **EYEWITNESS REFUTED ✗**
- **A:** The yellow Recurly button is staged in the upper-left quadrant.
- **B:** The yellow Recurly button is staged in the lower-left quadrant.
- **Fix (advisory):** Reposition the yellow button to the upper-left quadrant.
- **Channel B:** In both Clip A and Clip B, the yellow Recurly button is located in the upper-left quadrant of the frame. It is not in the lower-left quadrant in Clip B.

### [sev 2] lighting @ t=9.50s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame show a distinct vignette darkening.
- **B:** The corners of the frame are bright and lack a vignette.
- **Fix (advisory):** Apply a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":203.26,"center_mean":200.61,"falloff_pct":-1.32} vs {"corner_mean":195.97,"center_mean":189.8,"falloff_pct":-3.25}

### [sev 2] lighting @ t=9.20s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The shadow cast by the yellow button is soft and diffused.
- **B:** The shadow cast by the yellow button is dark and sharp.
- **Fix (advisory):** Soften the shadows cast by the buttons.
- **Measurement:** {"p01":77.8,"p1":117.05,"p5":150.14,"p50":201.47,"p95":244.78,"p99":246.78,"p999":247,"span_p5_p95":94.64} vs {"p01":87.3,"p1":146.82,"p5":152.03,"p50":212.81,"p95":236.73,"p99":252.08,"p999":254.79,"span_p5_p95":84.7}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

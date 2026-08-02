# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle and staging elements to match the composition and color scheme of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=2.10s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera has a moderate tilt, showing the yellow card at the bottom.
- **B:** The camera is tilted much more steeply, showing the yellow card at the top-left.
- **Fix (advisory):** Match the camera rotation, position, and focal length to Video A.
- **Channel B:** The claim accurately describes the camera tilt and the position of the yellow card in both clips. In Clip A, the yellow card is at the bottom, while in Clip B, the camera is tilted more steeply, showing the yellow card at the top-left.

### [sev 3] lighting @ t=2.10s — 2/3 runs — **MEASURED ✓**
- **A:** The white tiles have bright, high-contrast highlights.
- **B:** The white tiles are dull and grey with low contrast.
- **Fix (advisory):** Increase key light intensity and adjust contrast curve.
- **Measurement:** {"p01":55.31,"p1":79.89,"p5":89.83,"p50":207.53,"p95":243.22,"p99":246.59,"p999":249.59,"span_p5_p95":153.39} vs {"p01":76.93,"p1":102.91,"p5":123.93,"p50":208.43,"p95":226.8,"p99":228.09,"p999":231.09,"span_p5_p95":102.87}

### [sev 2] color @ t=2.10s — 2/3 runs — **MEASURED ✓**
- **A:** The blue shield icon on the 'Secure Payments' card is highly saturated.
- **B:** The blue shield icon is noticeably desaturated.
- **Fix (advisory):** Increase the saturation of the blue material on the shield icon.
- **Measurement:** {"r":188.21,"g":200.46,"b":204.01,"rb_delta":-15.8,"saturation":0.2023} vs {"r":200.46,"g":201.96,"b":199.85,"rb_delta":0.61,"saturation":0.0882}

### [sev 3] staging @ t=2.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** A yellow card is visible in the top-left corner of the frame.
- **B:** The top-left corner shows a white card instead of a yellow card.
- **Fix (advisory):** Change the material or color of the top-left card to yellow.
- **Channel B:** In Clip A, at around 00:00.875, a yellow card is clearly visible in the top-left corner of the frame. In Clip B, at the same timestamp, the top-left corner shows a white card instead.

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

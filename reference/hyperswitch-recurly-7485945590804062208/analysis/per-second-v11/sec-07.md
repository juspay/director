# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera angle and perspective to match the top-down view of the reference, and soften the high-contrast shadows.

## Verified / surviving claims
### [sev 3] lighting @ t=7.50s — 3/3 runs — **MEASURED ✓**
- **A:** The scene is brightly lit with soft, subtle shadows and high-exposure white surfaces.
- **B:** The scene is dimly lit with high contrast, showing deep black shadows under the raised cards.
- **Fix (advisory):** Increase the ambient light intensity and soften the shadows to match the bright, high-key lighting of the reference.
- **Measurement:** {"p01":65.23,"p1":69.47,"p5":75.95,"p50":200.32,"p95":246.42,"p99":247.86,"p999":253.09,"span_p5_p95":170.47} vs {"p01":7.08,"p1":8.88,"p5":32.83,"p50":156.12,"p95":196.4,"p99":206.77,"p999":254.5,"span_p5_p95":163.57}

## Killed in verification
### [sev 3] camera @ t=7.50s — 3/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned directly above the blue card, showing it aligned horizontally with a flat perspective.
- **B:** The camera is at an oblique angle, showing the blue card rotated diagonally with a strong perspective.
- **Fix (advisory):** Adjust the camera angle and rotation to match the top-down perspective of the reference.
- **Channel B (Gemini):** supported — The description of both clips is highly accurate. Clip A shows a top-down, flat perspective with the blue card aligned horizontally, while Clip B shows an oblique angle with the blue card rotated diagonally and a strong perspective effect.
- **Channel A (Claude):** refuted — The claim's A half is false: A is oblique too and its card sits diagonally in frame. Real difference in this pair: A's pronounced dome and wide plinth vs B's flat read.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

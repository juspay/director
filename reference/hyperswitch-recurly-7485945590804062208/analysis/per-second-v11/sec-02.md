# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Add the missing yellow and blue background cards on the left side, adjust the camera perspective, and increase shadow density/ambient occlusion.

## Verified / surviving claims
### [sev 3] lighting @ t=2.10s — 2/3 runs — **MEASURED ✓**
- **A:** Deep shadows and soft ambient occlusion are visible around the edges of the 'Secure Payments' card, creating depth.
- **B:** The lighting is flat and bright, with almost no ambient occlusion or contact shadows around the card.
- **Fix (advisory):** Adjust the lighting setup to include stronger ambient occlusion and contact shadows to match the reference.
- **Measurement:** {"p01":55.31,"p1":79.89,"p5":89.83,"p50":207.53,"p95":243.22,"p99":246.59,"p999":249.59,"span_p5_p95":153.39} vs {"p01":91.08,"p1":104.63,"p5":120.27,"p50":207.09,"p95":225.24,"p99":227.24,"p999":245.23,"span_p5_p95":104.97}

### [sev 3] staging @ t=2.30s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** A solid yellow card is visible at the top-left and a solid blue card at the bottom-left of the frame.
- **B:** The background on the left consists of plain white cards, with the yellow and blue cards missing.
- **Fix (advisory):** Add the colored background cards on the left side to match the reference composition.
- **Channel B (Gemini):** supported — The claim accurately describes the differences between Clip A and Clip B. In Clip A, during the second shot (from 01:250 onwards), a solid yellow card is visible at the top-left and a solid blue card is visible at the bottom-left. In Clip B, these are replaced by plain white cards.
- **Channel A (Claude):** supported — Same placement family: A's yellow/blue accents sit top-left where B shows plain white.

### [sev 2] camera @ t=2.40s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera has a wider field of view with more pronounced perspective distortion on the cards.
- **B:** The camera has a narrower field of view, making the perspective look flatter and more orthographic.
- **Fix (advisory):** Increase the camera's field of view (decrease focal length) to match the perspective of the reference.
- **Channel B (Gemini):** supported — Clip A shows a wider field of view with more pronounced perspective distortion (lines of the cards converge more sharply), whereas Clip B uses a longer focal length (narrower field of view) which flattens the perspective, making the cards look more orthographic.
- **Channel A (Claude):** supported — Real and actionable: A's lens reads wider with more perspective distortion up close; B at fov 33-34 is flatter. Pairs with the dome finding below.

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

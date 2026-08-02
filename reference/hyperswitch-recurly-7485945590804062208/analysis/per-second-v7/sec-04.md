# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera framing, directional lighting, and color grading to restore the close-up, high-contrast, and cool-toned aesthetic of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=4.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** Close-up framing of stacked cards with yellow card visible top-left.
- **B:** Distant framing making cards appear smaller; top-left yellow card is out of frame.
- **Fix (advisory):** Match camera position and focal length to reference.
- **Channel B (Gemini):** supported — Clip A shows a close-up view of the stacked cards with a yellow bar/card clearly visible in the top-left corner. Clip B has a more distant framing where the cards appear smaller, and the yellow card in the top-left is out of frame.
- **Channel A (Claude):** supported — Shot-2 family, same signature: B wider with emptier surroundings; A packs a yellow card top-left that B's framing loses.

### [sev 3] lighting @ t=4.60s — 3/3 runs — **MEASURED ✓**
- **A:** Distinct soft shadows cast to the left and bottom of cards.
- **B:** Extremely flat lighting with almost no visible shadows.
- **Fix (advisory):** Adjust directional light angle and intensity to cast softer, deeper shadows.
- **Measurement:** {"p01":65.79,"p1":77.78,"p5":136.45,"p50":208.47,"p95":245.16,"p99":249.14,"p999":251.01,"span_p5_p95":108.71} vs {"p01":72.18,"p1":94.55,"p5":164.67,"p50":192.87,"p95":214.68,"p99":216.4,"p999":253.86,"span_p5_p95":50.01}

## Killed in verification
### [sev 3] color @ t=4.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene has a cool blue color cast.
- **B:** The scene is neutral white and grey.
- **Fix (advisory):** Add a cool color grade to match the reference.
- **Measurement:** {"r":191.1,"g":203.02,"b":212.64,"rb_delta":-21.55,"saturation":0.1231} vs {"r":187.38,"g":194.87,"b":213.78,"rb_delta":-26.39,"saturation":0.1192}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

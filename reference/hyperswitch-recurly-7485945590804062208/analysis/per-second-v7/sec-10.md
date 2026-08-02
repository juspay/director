# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera position and focal length to match the close-up framing and perspective of the reference.

## Verified / surviving claims
### [sev 2] color @ t=10.50s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow button has a warm golden hue, and the scene is warmer.
- **B:** The yellow button has a cooler greenish-yellow hue, and the scene is cooler.
- **Fix (advisory):** Adjust the color temperature and yellow hue to match the warm reference.
- **Measurement:** {"r":193.29,"g":203.73,"b":201.96,"rb_delta":-8.67,"saturation":0.191} vs {"r":166.37,"g":175.65,"b":189.99,"rb_delta":-23.61,"saturation":0.2162}

## Killed in verification
### [sev 3] camera @ t=10.50s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Tighter camera framing on the yellow card.
- **B:** Wider camera framing showing more surrounding grid.
- **Fix (advisory):** Adjust camera distance to match reference framing.
- **Channel B (Gemini):** supported — Clip A shows a tighter framing where the yellow and blue cards are closer to the edges of the frame, whereas Clip B shows a wider framing with more of the surrounding grid tiles visible on all sides.
- **Channel A (Claude):** refuted — Same lockup at t=10.x: framing at parity, B's cards no smaller. Stale claim family.

### [sev 2] lighting @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** There is a distinct vignette with darker corners and a brighter center.
- **B:** The lighting is uniform across the frame with no noticeable vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":181.62,"center_mean":175.86,"falloff_pct":-3.28}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

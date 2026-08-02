# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera distance and enhance shadow depth to match the tighter, high-contrast composition of the reference.

## Verified / surviving claims
### [sev 3] lighting @ t=14.20s — 2/3 runs — **MEASURED ✓**
- **A:** The lighting is bright and clean, creating high-contrast highlights on the white surfaces.
- **B:** The lighting is dimmer and flatter, resulting in a greyish cast across the tiles.
- **Fix (advisory):** Increase key light intensity and adjust contrast.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":89.96,"p1":90.96,"p5":96.95,"p50":192.74,"p95":211.67,"p99":215.74,"p999":239.72,"span_p5_p95":114.72}

## Killed in verification
### [sev 3] camera @ t=14.20s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Tighter framing on the Recurly and Hyperswitch blocks.
- **B:** Wider camera composition showing more surrounding tiles.
- **Fix (advisory):** Adjust camera distance to match the tighter framing.
- **Channel B (Gemini):** supported — Clip A shows a tight framing on the Recurly and Hyperswitch blocks with a blurry background, while Clip B shows a wider composition with clearly visible surrounding 3D tiles.
- **Channel A (Claude):** refuted — Lockup framing at parity or B larger, fourth consecutive pass. The 'wider composition' family is model prior, not pixels.

### [sev 3] color @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow card is highly saturated and warm.
- **B:** The yellow card is desaturated and pale.
- **Fix (advisory):** Increase saturation and warmth.
- **Measurement:** {"r":194.72,"g":204.52,"b":200.82,"rb_delta":-6.1,"saturation":0.1835} vs {"r":168.82,"g":175.84,"b":190.43,"rb_delta":-21.61,"saturation":0.1966}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

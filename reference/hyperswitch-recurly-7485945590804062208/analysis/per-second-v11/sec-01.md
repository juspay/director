# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the layout and camera framing to match the reference, ensuring the correct cards (including the yellow card) are visible in the frame.

## Verified / surviving claims
### [sev 3] layout @ t=1.00s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** A yellow tile is positioned directly below the 'Secure Payments' tile.
- **B:** A white tile with horizontal lines is positioned directly below the 'Secure Payments' tile.
- **Fix (advisory):** Reorganize the tile grid layout so that the yellow tile is positioned directly below the Secure Payments tile.
- **Channel B (Gemini):** supported — The claim is fully supported. In Clip A, a yellow tile is clearly visible directly below the 'Secure Payments' tile. In Clip B, a white tile with horizontal lines is positioned directly below the 'Secure Payments' tile.
- **Channel A (Claude):** supported — Accent placement: A has a solid yellow tile directly below Secure Payments; B's lottery put a ruled tile there.

### [sev 2] lighting @ t=1.20s — 2/3 runs — **MEASURED ✓**
- **A:** Deep shadows are visible under the edges of the cards, creating high contrast.
- **B:** Shadows under the cards are extremely faint, resulting in a flat, low-contrast appearance.
- **Fix (advisory):** Adjust the light source intensity and shadow settings to deepen the shadows and increase contrast.
- **Measurement:** {"p01":56.54,"p1":83.76,"p5":97.19,"p50":204.54,"p95":245.01,"p99":248.73,"p999":250.52,"span_p5_p95":147.82} vs {"p01":85.45,"p1":102.31,"p5":111.63,"p50":201.72,"p95":221.81,"p99":223.31,"p999":232.67,"span_p5_p95":110.18}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
- yellow card

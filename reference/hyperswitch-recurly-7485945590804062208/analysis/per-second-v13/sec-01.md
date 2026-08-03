# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera angle and distance to match the reference perspective, and add realistic contact shadows beneath the tiles to restore the 3D depth.

## Verified / surviving claims
### [sev 3] camera @ t=1.50s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera is oriented with a mild rotation, keeping the 'Secure Payments' card nearly aligned with the frame's vertical axis.
- **B:** The camera has a pronounced Dutch tilt, rotating the 'Secure Payments' card significantly to the left.
- **Fix (advisory):** Align the camera's roll and pitch angles to match the reference composition.
- **Channel B:** In Clip A, the 'Secure Payments' card is oriented nearly vertically, aligned with the frame's vertical axis. In Clip B, the camera has a pronounced Dutch tilt, causing the card to be rotated significantly to the left (counter-clockwise).

### [sev 3] lighting @ t=1.50s — 2/3 runs — **MEASURED ✓**
- **A:** Soft, dark contact shadows are cast beneath the white tiles onto the grey background, creating depth.
- **B:** The contact shadows are extremely faint, resulting in a flat appearance with little separation between the tiles and the background.
- **Fix (advisory):** Enable or increase the strength of ambient occlusion and contact shadows under the tiles.
- **Measurement:** {"p01":57.25,"p1":83.76,"p5":96.27,"p50":203.89,"p95":245.37,"p99":249.44,"p999":251.78,"span_p5_p95":149.1} vs {"p01":27.46,"p1":103.11,"p5":108.78,"p50":223.93,"p95":248.8,"p99":252.08,"p999":254.5,"span_p5_p95":140.02}

### [sev 3] material @ t=1.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The frame surrounding the yellow tile at the bottom has a metallic silver finish with a brushed texture.
- **B:** The frame surrounding the yellow tile is a flat, matte grey plastic with no metallic reflections or texture.
- **Fix (advisory):** Add a metallic material with a brushed texture map to the tile borders.
- **Channel B:** In Clip A, the frame surrounding the yellow tile at the bottom clearly shows a brushed metallic silver texture. In Clip B, the same frame is a flat, matte grey plastic with no texture or metallic reflections.

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

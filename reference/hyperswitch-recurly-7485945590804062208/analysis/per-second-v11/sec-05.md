# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position and depth of field to match the close-up perspective, and add a vignette effect to darken the corners.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Corners of the frame are darker than the center, showing a clear vignette.
- **B:** Corners of the frame are bright, lacking a distinct vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":190.7,"center_mean":171.79,"falloff_pct":-11}

### [sev 3] camera @ t=5.50s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned closer to the cards, making the yellow Recurly card larger.
- **B:** The camera is positioned further away, making the yellow Recurly card smaller.
- **Fix (advisory):** Adjust camera distance to match reference framing.
- **Channel B (Gemini):** supported — The comparison of the two clips shows that in Clip A, the yellow Recurly card is indeed larger and the camera is closer, whereas in Clip B, the camera is further away and the card is smaller.
- **Channel A (Claude):** refuted — Size parity again (B's Recurly measures LARGER, ~74% vs ~69% frame width). The perceptual driver the model keeps reading as 'closer' is that A's card BOWS — dramatic dome with a sweeping specular bloom — giving it presence our subtle dome lacks at this angle.

### [sev 3] camera @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The background elements are heavily blurred due to shallow depth of field.
- **B:** The background elements remain sharp and in focus.
- **Fix (advisory):** Enable depth of field on the camera with a wide aperture focused on the Recurly tile.
- **Measurement:** {"lap_var":18.21} vs {"lap_var":6.92}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position, angle, and focal length to match the reference composition, apply a vignette to darken the corners, and cool down the white balance to match the cool blue-grey color cast.

## Verified / surviving claims
### [sev 3] camera @ t=0.20s — 3/3 runs — **EYEWITNESS ✓ (B)**
- **A:** The camera is closer to the tiles, showing a tight crop of the 'Secure Payments' card and a prominent blue tile on the left.
- **B:** The camera is further away and angled differently, showing more surrounding grey tiles and less of the blue tile.
- **Fix (advisory):** Match the camera position, rotation, and focal length to the reference.
- **Channel B (Gemini):** supported — The claim accurately describes the differences in camera distance, framing, and angle between Clip A and Clip B. Clip A has a closer, tighter crop with a prominent blue tile on the left, while Clip B is further away, angled differently, showing more surrounding grey tiles and less of the blue tile.
- **Channel A (Claude):** cannot_tell — Mixed claim: the 'angled differently' half is consistent with the elevation-hot family, but 'further away' belongs to the distance family refuted at parity in four consecutive passes.

## Killed in verification
### [sev 3] lighting @ t=0.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Darker corners indicate a strong vignette effect.
- **B:** The corners are bright, showing no significant vignette.
- **Fix (advisory):** Add a vignette to darken the corners of the frame.
- **Measurement:** {"corner_mean":202.03,"center_mean":205.44,"falloff_pct":1.66} vs {"corner_mean":186.37,"center_mean":213.07,"falloff_pct":12.53}

### [sev 3] color @ t=0.30s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The overall color palette is cooler with a blue-grey cast on the white tiles.
- **B:** The color palette is warmer with a cream cast on the white tiles.
- **Fix (advisory):** Cool down the white balance and adjust color grading.
- **Measurement:** {"r":190.25,"g":199.25,"b":201.91,"rb_delta":-11.66,"saturation":0.207} vs {"r":200.5,"g":205.25,"b":215.58,"rb_delta":-15.08,"saturation":0.0683}

## Present in A, absent in B (corroborated, unverified inventory)
- blue key on the left

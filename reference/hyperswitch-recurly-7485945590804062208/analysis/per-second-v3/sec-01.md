# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Match the camera framing, angle, and focal length of Video A, and restore the vibrant color saturation and contrast.

## Verified / surviving claims
### [sev 3] color @ t=1.00s — 3/3 runs — **MEASURED ✓**
- **A:** The tile on the left is vibrant blue and the tile at the bottom is bright yellow.
- **B:** The surrounding tiles are desaturated, appearing off-white or light gray.
- **Fix (advisory):** Apply the correct blue and yellow materials to the keyboard tiles surrounding the central card.
- **Measurement:** {"r":190.87,"g":200.41,"b":203.06,"rb_delta":-12.19,"saturation":0.1984} vs {"r":216.45,"g":210.44,"b":201.15,"rb_delta":15.3,"saturation":0.0794}

### [sev 2] camera @ t=1.50s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned close to the central card with a distinct tilt and shallow depth of field.
- **B:** The camera is further away, has a flatter angle, and a much wider depth of field.
- **Fix (advisory):** Adjust the camera position, tilt angle, and lens aperture to match the reference.
- **Channel B (Gemini):** supported — The camera in Clip A is indeed closer to the 'Secure Payments' card with a noticeable tilt and a shallow depth of field (the yellow card at the bottom and blue card on the left are blurry). In Clip B, the camera is positioned further back, showing more of the surrounding tiles, with a flatter angle and a wider depth of field where almost all elements are in sharp focus.
- **Channel A (Claude):** supported — Distance and DOF halves are unmistakable: A's card fills the frame with heavy edge falloff (yellow card below is fully bokeh'd); B frames far more set and holds near-uniform sharpness to the frame edges (ruled tile crisp at right border). The 'flatter angle' qualifier is not established — B's rake looks comparable — but nothing contradicts the claim's substance.

## Killed in verification
### [sev 2] lighting @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene has a soft lighting gradient with a distinct vignette that darkens the corners.
- **B:** The illumination is flat and uniform across the frame, lacking any corner falloff.
- **Fix (advisory):** Adjust the light sources and add a vignette pass to replicate the soft, focused lighting of the reference.
- **Measurement:** {"corner_mean":203.84,"center_mean":204.62,"falloff_pct":0.39} vs {"corner_mean":208.56,"center_mean":206.05,"falloff_pct":-1.22}

## Present in A, absent in B (corroborated, unverified inventory)
- blue card/tile on the left
- vignette

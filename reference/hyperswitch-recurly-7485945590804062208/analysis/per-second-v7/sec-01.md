# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position and focal length to match the close-up framing of Video A, and change the color of the left card to vibrant blue.

## Verified / surviving claims
### [sev 3] camera @ t=1.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned close to the 'Secure Payments' card, creating a tight close-up composition.
- **B:** The camera is positioned further away, resulting in a wider shot where the card occupies a smaller portion of the frame.
- **Fix (advisory):** Move the camera closer to the main card to match the reference framing.
- **Channel B (Gemini):** supported — Clip A shows a close-up shot of the 'Secure Payments' card, while Clip B shows a wider shot where the card is smaller and more of the surrounding elements are visible.
- **Channel A (Claude):** supported — Same shot-1 signature as 00:0 — steep dense vs shallow sparse; elevation and set density, not just dolly.

### [sev 3] color @ t=1.50s — 3/3 runs — **MEASURED ✓**
- **A:** The key on the left is bright blue and the key at the bottom is bright yellow.
- **B:** The keys on the left and bottom are plain light grey.
- **Fix (advisory):** Assign the correct blue and yellow materials to the keys surrounding the central 'Secure Payments' key.
- **Measurement:** {"r":190.28,"g":199.88,"b":202.67,"rb_delta":-12.39,"saturation":0.201} vs {"r":194.99,"g":200.06,"b":209.87,"rb_delta":-14.89,"saturation":0.0687}

## Killed in verification
### [sev 2] lighting @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** There is a distinct soft shadow falloff towards the corners of the frame, creating a subtle vignette.
- **B:** The lighting is flat and uniform across the entire frame, with no noticeable vignette.
- **Fix (advisory):** Add a vignette or adjust the light sources to create a soft falloff towards the edges of the frame.
- **Measurement:** {"corner_mean":203.84,"center_mean":204.62,"falloff_pct":0.39} vs {"corner_mean":196.82,"center_mean":203.92,"falloff_pct":3.48}

## Present in A, absent in B (corroborated, unverified inventory)
- blue card on the left
- yellow card at the bottom of the grid

# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position, focal length, and depth of field to match the close-up, blurred-background composition of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=11.30s — 2/3 runs — **MEASURED ✓**
- **A:** The background tiles in the upper-right corner are heavily blurred by a shallow depth of field.
- **B:** The background tiles in the upper-right corner are sharp and clearly defined.
- **Fix (advisory):** Enable depth of field in the camera settings and set a wider aperture to blur the background.
- **Measurement:** {"lap_var":0.9} vs {"lap_var":3.94}

### [sev 2] color @ t=11.20s — 2/3 runs — **MEASURED ✓**
- **A:** The overall image has a warm, yellowish color cast, especially visible on the white tiles.
- **B:** The image has a neutral to cool blue-grey color cast.
- **Fix (advisory):** Adjust the color temperature of the lights or color grade the output to add a warm tint.
- **Measurement:** {"r":192.94,"g":204.4,"b":200.57,"rb_delta":-7.63,"saturation":0.1915} vs {"r":139.71,"g":152.87,"b":189.19,"rb_delta":-49.48,"saturation":0.3126}

## Killed in verification
### [sev 3] lighting @ t=11.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong corner vignette and soft shadow falloff across the white tiles, creating depth.
- **B:** Flat, uniform white lighting across the entire grid with minimal corner shading.
- **Fix (advisory):** Adjust lighting setup and add a vignette to match the reference's depth.
- **Measurement:** {"corner_mean":209.77,"center_mean":197.73,"falloff_pct":-6.09} vs {"corner_mean":149.25,"center_mean":154.51,"falloff_pct":3.4}

### [sev 3] camera @ t=11.00s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned close to the tiles, creating a tight composition where the yellow and blue buttons dominate the frame.
- **B:** The camera is further away, showing a wider view with smaller buttons and more surrounding empty tiles.
- **Fix (advisory):** Move the camera closer to the subject and adjust the field of view to match the tight framing of the reference.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a close-up view where the yellow and blue buttons occupy most of the frame, while Clip B shows a wider shot with smaller buttons and more surrounding tiles visible.
- **Channel A (Claude):** refuted — Lockup parity family.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

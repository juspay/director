# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Rearrange the keyboard grid layout to place the yellow key at the bottom and the blue key on the left, and adjust the camera framing and depth of field to match the reference.

## Verified / surviving claims
### [sev 3] layout @ t=1.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The 'Secure Payments' card is centered and occupies a larger portion of the frame with tighter gaps between surrounding keys.
- **B:** The 'Secure Payments' card is shifted to the left, with wider gaps between the keys.
- **Fix (advisory):** Adjust the layout and spacing of the keys to match the reference.
- **Channel B (Gemini):** supported — The comparison is accurate. In Clip A, the 'Secure Payments' card is centered, larger, and the gaps between the surrounding blocks are very tight. In Clip B, the card is shifted to the left, and the gaps between the blocks are visibly wider.
- **Channel A (Claude):** supported — Same spacing family upheld last pass: A packs tighter with the subject more central.

## Killed in verification
### [sev 2] lighting @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame exhibit a pronounced dark falloff, creating a strong vignette.
- **B:** The corners of the frame are bright and evenly lit, with no visible vignette.
- **Fix (advisory):** Add a post-processing vignette or adjust the camera lens settings to simulate natural corner light falloff.
- **Measurement:** {"corner_mean":203.84,"center_mean":204.62,"falloff_pct":0.39} vs {"corner_mean":200.92,"center_mean":209.89,"falloff_pct":4.27}

### [sev 2] color @ t=1.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The white plastic keys have a cool, blueish color cast, particularly visible in the shadows.
- **B:** The white plastic keys are neutral grey/white with no blue color cast.
- **Fix (advisory):** Adjust the white balance or apply a cool color grade to the midtones and shadows to match the reference's blue tint.
- **Measurement:** {"r":190.28,"g":199.88,"b":202.67,"rb_delta":-12.39,"saturation":0.201} vs {"r":195.27,"g":201.25,"b":215.04,"rb_delta":-19.77,"saturation":0.0945}

### [sev 3] camera @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned close to the 'Secure Payments' card with a shallow depth of field blurring the background.
- **B:** The camera is positioned further away, showing more of the keyboard, with all keys in sharp focus.
- **Fix (advisory):** Adjust the camera position, focal length, and enable depth of field with a wider aperture to match the reference framing.
- **Measurement:** {"lap_var":21.84} vs {"lap_var":2.95}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

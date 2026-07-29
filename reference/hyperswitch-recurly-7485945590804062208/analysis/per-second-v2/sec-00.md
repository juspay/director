# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims discarded._

## Highest-impact fix
Ensure the 'Secure Payments' card is present and visible from the very first frame.

## Corroborated differences
### [sev 4] staging — 3/3 runs
- **A:** The 'Secure Payments' card is present and visible from the first frame.
- **B:** The card is missing initially and abruptly animates or pops in at 0.12 seconds.
- **Fix:** Ensure the 'Secure Payments' card is present and visible from frame 0.

### [sev 3] material — 2/3 runs
- **A:** Uses clean, solid-colored background plates or keys with minimal texture.
- **B:** Introduces a distracting, high-contrast dotted grid pattern on the background plates or keys.
- **Fix:** Remove the dotted texture map and use a clean, solid material.

### [sev 3] lighting — 2/3 runs
- **A:** Renders soft, diffuse ambient occlusion and contact shadows.
- **B:** Renders harsh, sharp, high-contrast drop shadows under the card.
- **Fix:** Soften the shadow maps and increase light diffusion to create realistic ambient occlusion.

## Present in A, absent in B
- The 'Secure Payments' card/tile at the start of the video (before 0.12 seconds)

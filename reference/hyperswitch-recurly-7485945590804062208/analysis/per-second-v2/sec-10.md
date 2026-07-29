# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 4 single-run claims discarded._

## Highest-impact fix
Rebuild the scene layout to assemble the floating elements into a tight, structured keyboard grid.

## Corroborated differences
### [sev 4] lighting — 2/3 runs
- **A:** Uses soft, diffused global illumination with realistic contact shadows.
- **B:** Uses flat, high-contrast lighting with harsh, unrealistic shadows.
- **Fix:** Increase shadow diffusion and enable high-quality ambient occlusion.

### [sev 4] staging — 2/3 runs
- **A:** Arranges cards/keys in a clean, structured 3D keyboard grid layout.
- **B:** Piles cards/keys in a chaotic, overlapping floating collage disconnected in 3D space.
- **Fix:** Realign and assemble the elements into a tight, structured keyboard grid.

### [sev 4] motion — 2/3 runs
- **A:** Keeps the yellow Recurly card/key static and pre-settled in its slot.
- **B:** Animates the yellow Recurly card/key popping up mid-shot.
- **Fix:** Remove the pop-up animation and keep the yellow card static from the start.

### [sev 3] camera — 2/3 runs
- **A:** Employs smooth, organic camera drift with exponential/cubic easing.
- **B:** Uses stiff, linear camera movement with minimal easing.
- **Fix:** Apply smooth cubic-bezier easing to the camera translation curves.

## Present in A, absent in B
- Structured keyboard grid layout

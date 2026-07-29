# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 3 single-run claims discarded._

## Highest-impact fix
Add an animated dappled leaf shadow gobo to the primary light source to project moving shadows across the scene.

## Corroborated differences
### [sev 4] lighting — 2/3 runs
- **A:** Casts organic, sweeping leaf shadows across the grid using an animated gobo filter.
- **B:** Uses flat, static, uniform lighting with no moving environmental shadows.
- **Fix:** Add an animated gobo map with a leaf texture to the primary light source to project moving shadows.

### [sev 3] camera — 2/3 runs
- **A:** Uses a wider focal length / wide-angle lens creating dynamic perspective distortion.
- **B:** Uses a narrow focal length / flatter lens, making the layout look flat and orthographic.
- **Fix:** Decrease camera focal length and adjust camera distance to match the dynamic perspective.

### [sev 3] lighting — 2/3 runs
- **A:** Displays soft, realistic contact shadows beneath the cards/keys.
- **B:** Displays harsh, weak, or artificial-looking shadows with flat lighting.
- **Fix:** Increase light source size or adjust ambient occlusion to soften the shadow penumbra and create realistic contact shadows.

## Present in A, absent in B
- Animated dappled leaf shadows (gobo light effect)
- Soft, realistic contact shadows around the card/key edges

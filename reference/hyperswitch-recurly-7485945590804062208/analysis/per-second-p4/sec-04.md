# Second 4 — original frames 120-149

_1/3 runs passed the ground-truth timing check; 0 single-run claims discarded._

## Highest-impact fix
Match the camera focal length and perspective angle of Video A to eliminate the flat, orthographic look of the card stack.

## Corroborated differences
### [sev 4] camera — 1/1 runs
- **A:** Uses a wide-angle lens close to the cards, creating dramatic perspective convergence and depth.
- **B:** Uses a telephoto lens far away, resulting in a flat, orthographic-like appearance.
- **Fix:** Decrease camera focal length to 50mm and move the camera closer to the cards to restore perspective depth.

### [sev 3] lighting — 1/1 runs
- **A:** Features directional key lighting casting soft, realistic contact shadows under the cards.
- **B:** Features flat, ambient lighting with weak, indistinct shadows.
- **Fix:** Add a directional key light from the top-left and enable high-quality contact shadows with a 15% soft radius.

### [sev 3] motion — 1/1 runs
- **A:** Camera pan has smooth, organic ease-in and ease-out curves.
- **B:** Camera pan is linear and robotic.
- **Fix:** Apply bezier interpolation to camera translation keyframes to match the organic easing.

## Present in A, absent in B
- Dramatic perspective convergence and shallow depth of field on the card stack.
- Satin specular reflections on the background grid.

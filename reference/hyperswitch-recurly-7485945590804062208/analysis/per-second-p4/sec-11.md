# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 2 single-run claims discarded._

## Highest-impact fix
Add the animated dappled leaf shadows and tighten the layout/framing to eliminate the flat, empty look.

## Corroborated differences
### [sev 4] lighting — 3/3 runs
- **A:** Uses dynamic, animated dappled leaf shadows moving across the grid.
- **B:** Uses flat, static, uniform lighting with no shadow movement.
- **Fix:** Add a directional light with an animated gobo/cookie texture to project moving dappled leaf shadows.

### [sev 4] layout — 2/3 runs
- **A:** Arranges tiles in a tight, dense grid layout with minimal gaps.
- **B:** Spaces tiles/cards far apart, leaving large empty white gaps.
- **Fix:** Reposition and scale the grid elements to reduce the gaps and tighten the layout.

### [sev 3] camera — 3/3 runs
- **A:** Executes a smooth, dynamic camera pull-back/zoom-out with strong ease-out.
- **B:** Uses a linear, slow, or nearly static camera zoom-out.
- **Fix:** Apply a cubic ease-out curve to the camera translation/zoom keyframes.

## Present in A, absent in B
- Animated dappled leaf shadows

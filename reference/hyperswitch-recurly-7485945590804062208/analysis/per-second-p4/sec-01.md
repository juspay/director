# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 8 single-run claims discarded._

## Highest-impact fix
Adjust the camera focal length and angle to restore the dramatic 3D perspective depth, and implement soft directional lighting with ambient occlusion to bring back the tactile quality.

## Corroborated differences
### [sev 3] camera — 3/3 runs
- **A:** Dynamic, organic camera perspective with strong depth and diagonal alignment.
- **B:** Flat, linear camera angle with weak perspective and infinite focus.
- **Fix:** Increase camera focal length (e.g., 85mm), adjust the angle to match the perspective depth, and use organic easing for the camera movement.

### [sev 3] lighting — 3/3 runs
- **A:** Soft directional key lighting with rich ambient occlusion and contact shadows.
- **B:** Flat, uniform lighting with washed-out shadows and minimal ambient occlusion.
- **Fix:** Add a strong directional key light from the top-left and enable high-quality contact ambient occlusion.

### [sev 2] typography — 2/3 runs
- **A:** Bold/medium-weight sans-serif font with tight tracking and precise alignment.
- **B:** Thinner font with loose tracking/spacing and poor alignment.
- **Fix:** Switch to a heavier sans-serif font weight and reduce tracking/line spacing.

## Present in A, absent in B
_Nothing corroborated._

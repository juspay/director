# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 4 single-run claims discarded._

## Highest-impact fix
Adjust the camera focal length and position to achieve a tight, dynamic close-up perspective, and add soft directional lighting with ambient occlusion to restore realistic 3D depth and shadows.

## Corroborated differences
### [sev 4] camera — 3/3 runs
- **A:** Uses a tight, dynamic close-up perspective (isometric/macro framing) with a narrow field of view.
- **B:** Uses a flatter, wider camera perspective, making elements appear smaller and less dynamic.
- **Fix:** Increase camera focal length to narrow the field of view and adjust the camera position/angle to match the tight, close-up framing of A.

### [sev 4] lighting — 3/3 runs
- **A:** Features soft directional lighting casting distinct, realistic contact shadows and ambient occlusion.
- **B:** Features flat, uniform lighting with weak, barely visible shadows, reducing 3D depth.
- **Fix:** Add a directional key light and enable high-quality soft shadows and ambient occlusion beneath the cards.

### [sev 3] motion — 3/3 runs
- **A:** Applies smooth, organic ease-in/ease-out curves to camera translation.
- **B:** Applies linear, stiff, and robotic interpolation to camera keyframes.
- **Fix:** Apply Bezier/cubic ease-in/ease-out curves to the camera translation keyframes to ensure natural deceleration.

## Present in A, absent in B
- Rich ambient occlusion and soft contact shadows beneath the card/button edges.

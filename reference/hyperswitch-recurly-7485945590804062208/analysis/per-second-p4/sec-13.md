# Second 13 — original frames 390-419

_3/3 runs passed the ground-truth timing check; 6 single-run claims discarded._

## Highest-impact fix
Apply a smooth ease-out curve to the camera translation keyframes and adjust the camera's focal length and tilt to restore the dynamic perspective and organic motion of the reference.

## Corroborated differences
### [sev 3] camera — 3/3 runs
- **A:** Executes a smooth camera pull-back with organic ease-out easing.
- **B:** Uses a stiff, linear camera zoom-out/drift that feels robotic.
- **Fix:** Apply a smooth cubic-bezier ease-out curve to the camera translation keyframes.

### [sev 3] camera — 2/3 runs
- **A:** Uses a dynamic, close-up perspective with a distinct camera tilt and tight framing.
- **B:** Uses a flatter, wider camera angle with less perspective depth.
- **Fix:** Adjust the camera focal length and tilt to match the dynamic perspective and tighter framing.

### [sev 3] lighting — 2/3 runs
- **A:** Employs soft directional lighting that creates realistic contact shadows and specular highlights.
- **B:** Uses flat, uniform, static lighting that washes out depth.
- **Fix:** Add a soft directional or area light source and enable ambient occlusion to generate realistic contact shadows.

### [sev 3] staging — 2/3 runs
- **A:** Renders tiles/cards with distinct physical 3D thickness and beveled edges.
- **B:** Renders tiles/cards as flat, thin 2D planes lacking physical depth.
- **Fix:** Increase the physical extrusion of the tiles/cards and add a bevel modifier.

## Present in A, absent in B
- Beveled tile/card edges
- Realistic contact and ambient occlusion shadows

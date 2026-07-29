# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 8 single-run claims discarded._

## Highest-impact fix
Add a light gobo with an organic leaf silhouette to project moving dappled shadows and adjust the camera pitch to restore perspective depth.

## Corroborated differences
### [sev 4] lighting — 2/3 runs
- **A:** Uses a complex dappled leaf shadow pattern to simulate natural light filtering.
- **B:** Uses flat, uniform studio lighting with no dappled shadow patterns.
- **Fix:** Add a light gobo with an organic leaf silhouette to project moving dappled shadows.

### [sev 4] motion — 2/3 runs
- **A:** Animates the 'Live Now' button rising up from the grid with a smooth, snappy ease-out.
- **B:** Keeps the 'Live Now' button static or animates it with stiff, linear motion.
- **Fix:** Animate the Z-position of the 'Live Now' button with a strong ease-out curve.

### [sev 3] camera — 2/3 runs
- **A:** Uses an oblique, low-angle camera perspective with strong depth.
- **B:** Uses a flatter, more top-down camera angle that reduces 3D depth.
- **Fix:** Adjust the camera pitch angle and focal length to restore the dramatic perspective depth.

## Present in A, absent in B
- Dappled leaf shadow overlay

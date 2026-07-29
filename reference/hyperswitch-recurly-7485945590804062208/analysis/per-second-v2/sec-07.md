# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 6 single-run claims discarded._

## Highest-impact fix
Align the background elements to a tight isometric grid, soften the lighting to introduce realistic ambient occlusion, and adjust the camera's focal length to correct the framing.

## Corroborated differences
### [sev 4] staging — 2/3 runs
- **A:** Background elements are aligned to a clean, tight isometric grid.
- **B:** Background elements are scattered, poorly spaced, or cluttered with large gaps.
- **Fix:** Align all background elements to a tight, cohesive isometric grid.

### [sev 4] lighting — 2/3 runs
- **A:** Soft, diffused lighting with realistic ambient occlusion and soft contact shadows.
- **B:** Harsh, direct lighting with dark, sharp drop shadows and lacking realistic ambient occlusion.
- **Fix:** Soften the key light source to create diffused shadows and enable a stronger ambient occlusion pass.

### [sev 3] camera — 2/3 runs
- **A:** Clean, tight camera framing with a narrower field of view.
- **B:** Wider, misaligned framing with perspective distortion.
- **Fix:** Adjust the camera's focal length and position to achieve a tighter, more centered framing.

## Present in A, absent in B
- Soft ambient occlusion in card crevices
- Clean, tight isometric grid layout of background elements

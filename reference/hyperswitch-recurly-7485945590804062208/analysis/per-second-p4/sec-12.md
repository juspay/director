# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 5 single-run claims discarded._

## Highest-impact fix
Increase the light source radius to soften harsh shadows and enable ambient occlusion to eliminate the flat, sterile look in B.

## Corroborated differences
### [sev 3] camera — 2/3 runs
- **A:** Executes a dynamic camera movement with organic easing.
- **B:** Uses a rigid, linear camera path with stiff interpolation.
- **Fix:** Apply bezier curves to the camera animation to create a smooth ease-out.

### [sev 3] lighting — 3/3 runs
- **A:** Features soft, diffused lighting with realistic contact shadows and ambient occlusion.
- **B:** Has flat, sterile lighting with harsh, uniform shadows and minimal ambient occlusion.
- **Fix:** Increase the light source radius to soften shadow penumbras and enable ambient occlusion.

### [sev 3] material — 2/3 runs
- **A:** Applies a subtle matte texture with fine roughness to the surfaces.
- **B:** Uses perfectly smooth, default shaders with no texture.
- **Fix:** Add a subtle noise map to the roughness channel to break up specular highlights and simulate a matte finish.

## Present in A, absent in B
- Soft ambient occlusion and contact shadows in crevices and under elements.

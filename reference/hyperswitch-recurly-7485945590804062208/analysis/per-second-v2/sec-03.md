# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 5 single-run claims discarded._

## Highest-impact fix
Rebuild the staging geometry to group the cards on a single, continuous white block structure rather than separate segmented cards over a grid.

## Corroborated differences
### [sev 4] staging — 2/3 runs
- **A:** Groups the cards or keys on a single, continuous, unified white block or track structure.
- **B:** Places them on separate, segmented floating cards or blocks over a grid background.
- **Fix:** Rebuild the geometry to group the elements onto a single, continuous white block structure and remove the segmented grid layout.

### [sev 3] lighting — 3/3 runs
- **A:** Employs soft, diffused lighting with rich ambient occlusion in the crevices and subtle color gradients.
- **B:** Uses flat, uniform, or harsh lighting with weak or sharp shadows and minimal ambient occlusion.
- **Fix:** Soften the light sources, enable high-quality ambient occlusion, and introduce subtle color gradients to the lighting.

### [sev 3] camera — 2/3 runs
- **A:** Uses a camera with a shallow depth of field, creating a soft background blur.
- **B:** Uses a camera with a deep or infinite depth of field, leaving background elements in sharp focus.
- **Fix:** Enable shallow depth of field with a wide aperture focused on the foreground elements.

### [sev 3] material — 2/3 runs
- **A:** Features a realistic brushed metal material with anisotropic reflections on the borders or panels.
- **B:** Uses flat, matte shaders without texture or metallic reflections.
- **Fix:** Apply a brushed metal texture with anisotropic reflections to the metallic borders and panels.

## Present in A, absent in B
- Shallow depth-of-field blur on background elements.
- Brushed-metal texture on the borders or panels.
- Continuous, unified white block or track structure housing the keys.

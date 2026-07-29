# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 3 single-run claims discarded._

## Highest-impact fix
Enable ambient occlusion and soften the directional light source to eliminate harsh shadows, and adjust the camera to a low-angle perspective with a shallow depth of field focusing on the main card.

## Corroborated differences
### [sev 4] lighting — 3/3 runs
- **A:** Uses soft, diffused lighting with realistic ambient occlusion and subtle specular highlights.
- **B:** Renders with flat, uniform lighting and harsh, sharp-edged shadows.
- **Fix:** Enable ambient occlusion, increase the light source size to soften shadow edges, and add subtle specular highlights to the card surfaces.

### [sev 3] camera — 2/3 runs
- **A:** Applies a shallow depth of field to naturally blur background elements and focus on the main card.
- **B:** Keeps the entire scene in sharp focus, flattening the composition.
- **Fix:** Enable camera depth of field, set focus to the main card, and adjust the aperture to blur background elements.

### [sev 3] camera — 2/3 runs
- **A:** Uses a low-angle perspective to emphasize 3D depth and volume.
- **B:** Uses a steep, high-angle or top-down perspective that flattens the composition.
- **Fix:** Lower the camera pitch angle and adjust the position/focal length to restore a low-angle perspective with 3D depth.

### [sev 3] material — 2/3 runs
- **A:** Defines card edges naturally using soft lighting and bevels.
- **B:** Adds an artificial, harsh dark outline or stroke effect along the edges of the card.
- **Fix:** Remove the dark outline/stroke from the card geometry and rely on soft specular highlights and bevels to define the edges.

## Present in A, absent in B
- Soft contact shadows and realistic ambient occlusion.
- Shallow depth-of-field blur on background elements.
- Realistic matte plastic material textures and reflections.

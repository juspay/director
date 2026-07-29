# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 8 single-run claims discarded._

## Highest-impact fix
Bring the camera closer to match the tight, dynamic perspective of the reference, enable ambient occlusion to ground the blocks, and add bevels to the edges to catch specular highlights.

## Corroborated differences
### [sev 4] lighting — 2/3 runs
- **A:** Features soft, realistic contact shadows and ambient occlusion that ground the blocks.
- **B:** Lacks contact shadows and ambient occlusion, making the blocks appear flat or floating.
- **Fix:** Enable ambient occlusion and add a soft directional key light to cast subtle contact shadows under the blocks.

### [sev 4] camera — 2/3 runs
- **A:** Closely framed with a dynamic perspective.
- **B:** Zoomed too far back, creating a flat, orthographic-like composition with excessive empty space.
- **Fix:** Bring the camera closer and adjust the focal length to match the closer, more dynamic framing of the reference.

### [sev 3] material — 3/3 runs
- **A:** Blocks and buttons feature rounded bevels with subtle gloss and realistic specular highlights on the edges.
- **B:** Blocks and buttons have sharp, unbeveled edges with flat, non-reflective shaders.
- **Fix:** Add a bevel to the block and button geometries and increase material glossiness/specular intensity to catch edge highlights.

## Present in A, absent in B
- Bevel reflections on the edges of the blocks and buttons

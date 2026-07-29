# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 2 single-run claims discarded._

## Highest-impact fix
Rebuild the scene layout to place the cards/buttons into a structured 3D keyboard grid instead of letting them float as flat, unstructured layers.

## Corroborated differences
### [sev 4] staging — 3/3 runs
- **A:** Embeds the buttons/cards as physical elements within a structured 3D keyboard grid.
- **B:** Floats the elements as flat, overlapping layers in an unstructured space.
- **Fix:** Rebuild the scene layout to place the elements into a solid 3D grid frame with proper recesses.

### [sev 3] lighting — 3/3 runs
- **A:** Uses soft directional lighting with rich contact shadows and ambient occlusion.
- **B:** Uses flat, ambient lighting with almost no contact shadows.
- **Fix:** Add a directional key light and enable high-quality ambient occlusion to ground the elements.

### [sev 3] camera — 2/3 runs
- **A:** Maintains a low-angle perspective looking across the elements to emphasize depth.
- **B:** Uses a flatter, more top-down or high-angle perspective.
- **Fix:** Lower the camera angle to match the low-angle perspective of the reference.

## Present in A, absent in B
- Physical 3D keyboard grid structure
- Ambient occlusion and contact shadows in the recesses

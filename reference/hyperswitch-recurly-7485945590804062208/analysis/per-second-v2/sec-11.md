# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 7 single-run claims discarded._

## Highest-impact fix
Rebuild the scene layout to align the cards into a structured, physical 3D grid.

## Corroborated differences
### [sev 4] layout — 3/3 runs
- **A:** Arranges cards in a structured, physical 3D grid.
- **B:** Floats cards loosely in 3D space without a physical grid structure.
- **Fix:** Rebuild the layout to align cards into a structured, physical 3D grid.

### [sev 3] lighting — 3/3 runs
- **A:** Uses directional lighting with realistic, soft contact shadows.
- **B:** Uses flat, uniform lighting with weak or non-existent shadows.
- **Fix:** Add a directional light source and enable soft contact shadows.

## Present in A, absent in B
- A structured, physical grid layout to house the cards

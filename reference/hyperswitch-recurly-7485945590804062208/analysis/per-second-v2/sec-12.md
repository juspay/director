# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 5 single-run claims discarded._

## Highest-impact fix
Rebuild the layout to tightly nest the cards into a structured grid instead of letting them float loosely in 3D space.

## Corroborated differences
### [sev 4] staging — 3/3 runs
- **A:** Nests cards neatly into a structured, cohesive grid layout (like a keyboard grid or tiled surface).
- **B:** Floats cards loosely and disorganized in 3D space.
- **Fix:** Rebuild the layout to align and nest the cards tightly into a structured grid, eliminating the loose floating gaps.

### [sev 3] lighting — 3/3 runs
- **A:** Uses soft, realistic studio lighting with smooth shadow falloff and ambient occlusion.
- **B:** Uses flat, uniform lighting with harsh or weak shadows and poor depth.
- **Fix:** Soften shadow penumbras, increase light source size, and enable high-quality ambient occlusion.

## Present in A, absent in B
- Keyboard-like interlocking grid layout
- Realistic ambient occlusion and soft contact shadows between cards

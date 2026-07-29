# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims discarded._

## Highest-impact fix
Enable high-quality ambient occlusion and soft contact shadows to resolve the flat, unrealistic lighting in Video B.

## Corroborated differences
### [sev 4] layout — 2/3 runs
- **A:** Arranges cards in a clean, structured, balanced grid layout.
- **B:** Scatters cards loosely or chaotically.
- **Fix:** Align all cards to a structured, balanced grid layout.

### [sev 4] camera — 2/3 runs
- **A:** Uses a shallow depth of field to blur background elements.
- **B:** Has infinite depth of field with all elements in sharp focus.
- **Fix:** Enable shallow depth of field focused on the central cards to blur background elements.

### [sev 3] lighting — 3/3 runs
- **A:** Uses dynamic lighting with soft ambient occlusion, contact shadows, and dappled patterns.
- **B:** Uses flat, uniform lighting with weak or harsh shadows and lacks ambient occlusion.
- **Fix:** Enable high-quality ambient occlusion and add soft, dynamic shadow/light patterns.

### [sev 3] camera — 2/3 runs
- **A:** Features smooth, organic camera movement with natural drift or ease-out curves.
- **B:** Has static or linear camera movement lacking natural organic feel.
- **Fix:** Add subtle organic drift/noise and apply natural ease-out curves to the camera keyframes.

## Present in A, absent in B
- Soft ambient occlusion and contact shadows under floating cards
- Shallow depth of field blur on background elements
- Dappled light and shadow patterns

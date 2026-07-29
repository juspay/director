# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 8 single-run claims discarded._

## Highest-impact fix
Adjust the ambient occlusion and contact shadows to be softer and more realistic, and re-animate the camera path with organic easing curves to restore natural depth and motion.

## Corroborated differences
### [sev 3] camera — 2/3 runs
- **A:** Executes a smooth, dynamic camera movement with organic easing and subtle drift or tilt.
- **B:** Performs a rigid, linear zoom-out that feels mechanical and lacks perspective shift.
- **Fix:** Re-animate the camera path using bezier curves to introduce natural easing and a subtle perspective drift.

### [sev 3] lighting — 3/3 runs
- **A:** Renders soft, realistic contact shadows and rich ambient occlusion that define the depth and volume of the elements.
- **B:** Uses flat lighting with either missing contact shadows or harsh, uniform, unrealistic outlines.
- **Fix:** Enable high-quality ambient occlusion and soften the contact shadows using a larger light source size and realistic falloff.

### [sev 3] material — 2/3 runs
- **A:** Renders the yellow card with soft, realistic edge bevels that catch subtle highlights.
- **B:** Renders the yellow card with sharp, flat, CG-looking edges and no specular variation.
- **Fix:** Increase the bevel radius on the yellow card to soften the edges and allow them to catch highlights.

## Present in A, absent in B
- Realistic soft ambient occlusion and contact shadows
- Subtle bevel highlights on the edges of the yellow card

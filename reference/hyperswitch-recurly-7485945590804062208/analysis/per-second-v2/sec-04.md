# Second 4 — original frames 120-149

_1/3 runs passed the ground-truth timing check; 0 single-run claims discarded._

## Highest-impact fix
Synchronize the cut at t=4.896s to immediately display the yellow Recurly card rather than delaying its appearance with an extra transition.

## Corroborated differences
### [sev 4] staging — 1/1 runs
- **A:** Cuts directly to the yellow Recurly card at t=4.896s with the card fully visible.
- **B:** Cuts to a blank dark blue card at t=4.896s, delaying the yellow Recurly card's appearance until t=5.125s.
- **Fix:** Align the cut transition so the yellow Recurly card is immediately present upon the cut at t=4.896s.

### [sev 3] camera — 1/1 runs
- **A:** Smooth, organic camera drift with natural ease-out.
- **B:** Linear, mechanical camera pan that feels robotic.
- **Fix:** Apply a cubic-bezier ease-out curve to the camera translation keyframes.

### [sev 3] lighting — 1/1 runs
- **A:** Soft, diffused ambient occlusion and realistic contact shadows.
- **B:** Flat lighting with harsh, low-resolution contact shadows.
- **Fix:** Increase shadow map resolution and soften the shadow bias for a more diffused look.

## Present in A, absent in B
- Yellow Recurly card immediately post-cut
- Soft ambient occlusion in card gaps

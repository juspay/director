# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 6 single-run claims discarded._

## Highest-impact fix
Remove the sequential slide-in animations for the cards after the 8.1s cut, pre-positioning them so they are already floating in-frame immediately after the cut.

## Corroborated differences
### [sev 4] staging — 2/3 runs
- **A:** Pre-stages the floating cards so they are already in-frame and drifting immediately after the cut.
- **B:** Starts with an empty layout and slides the cards in late or sequentially after the cut.
- **Fix:** Remove the slide-in entry animations and pre-position the cards so they are already floating in-frame at the start of the cut.

### [sev 4] lighting — 2/3 runs
- **A:** Uses soft, diffuse lighting with rich ambient occlusion and soft contact shadows.
- **B:** Uses flat lighting with harsh, dark, or weak shadows and lacks realistic contact occlusion.
- **Fix:** Increase shadow blur and enable an ambient occlusion pass to soften contact areas between overlapping elements.

### [sev 3] motion — 2/3 runs
- **A:** Animates card movement with smooth, organic bezier easing.
- **B:** Animates card movement with stiff, linear easing, making the motion feel robotic.
- **Fix:** Apply ease-in-out bezier curves to the translation and rotation keyframes of the floating elements.

## Present in A, absent in B
- Ambient occlusion shadows between overlapping cards.
- Specular reflections on card surfaces.

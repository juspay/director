# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 7 single-run claims discarded._

## Highest-impact fix
Ensure the logo on the blue card/button is fully visible immediately after the cut instead of animating its opacity late.

## Corroborated differences
### [sev 4] motion — 2/3 runs
- **A:** Displays the logo fully printed on the blue card/button from the first frame of the cut.
- **B:** Fades or pops the logo onto the card/button late (approximately 0.2 seconds after the cut).
- **Fix:** Ensure the logo texture is fully visible on frame 1 of the shot instead of animating its opacity late.

### [sev 3] camera — 3/3 runs
- **A:** Moves the camera with a slow, elegant, and well-eased drift before the cut.
- **B:** Moves the camera with a faster, less eased, and more linear translation before the cut.
- **Fix:** Slow down the camera translation and apply smoother easing curves to match the reference.

### [sev 3] camera — 2/3 runs
- **A:** Maintains a tight, close-up perspective on the cards.
- **B:** Uses a wider focal length/perspective, exposing too much background.
- **Fix:** Increase the camera focal length and bring the camera closer to match the tight framing.

### [sev 3] lighting — 2/3 runs
- **A:** Uses soft, diffused lighting with realistic ambient occlusion shadows in the crevices.
- **B:** Renders flat or harsh lighting with weak ambient occlusion and poor shadow depth.
- **Fix:** Enable high-quality ambient occlusion contact shadows and soften the light source to create realistic penumbras.

## Present in A, absent in B
- The logo on the blue card/button immediately after the cut.

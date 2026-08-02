# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing to match the close-up views of the cards, and increase the contrast and color saturation of the blue elements to match the reference.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=6.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Close-up view of the yellow Recurly card with shallow depth of field.
- **B:** Wider camera view showing more surrounding cards with deep depth of field.
- **Fix (advisory):** Adjust camera distance and aperture to match the reference's close-up focus.
- **Measurement:** {"lap_var":54.16} vs {"lap_var":3.39}

### [sev 2] lighting @ t=6.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows between the tiles are deep and well-defined, giving a strong sense of depth.
- **B:** The shadows are very faint and washed out, making the tiles look flat.
- **Fix (advisory):** Adjust the shadow density and contrast to achieve deeper shadows.
- **Measurement:** {"p01":41.94,"p1":69.56,"p5":118.51,"p50":208.47,"p95":245.7,"p99":246.71,"p999":248.43,"span_p5_p95":127.19} vs {"p01":16.77,"p1":109.81,"p5":116.33,"p50":197,"p95":205.52,"p99":209.09,"p999":214.08,"span_p5_p95":89.19}

### [sev 3] color @ t=6.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The blue JUSPAY hyperswitch card has a highly saturated, vibrant royal blue color.
- **B:** The blue card is desaturated and has a flatter, less vibrant appearance.
- **Fix (advisory):** Increase the saturation and adjust the hue of the blue material to match the reference.
- **Measurement:** {"r":178.94,"g":190.03,"b":207.81,"rb_delta":-28.87,"saturation":0.2285} vs {"r":156.83,"g":160.47,"b":187.25,"rb_delta":-30.42,"saturation":0.2128}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

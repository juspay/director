# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Match the camera framing and focal length to the reference close-up perspective.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=10.00s — 3/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The yellow Recurly card is framed closely, occupying most of the center screen.
- **B:** The yellow Recurly card is framed from a distance, appearing much smaller.
- **Fix (advisory):** Adjust camera position and focal length to match the close-up perspective.
- **Channel B:** In Clip A, the yellow Recurly card is located in the top-left quadrant of the screen, not the center, and it does not occupy most of the center screen (which is occupied by the 'Live Now' button).

### [sev 3] lighting @ t=10.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with significant darkening at the corners.
- **B:** Flat, uniform lighting across the corners.
- **Fix (advisory):** Add a vignette post-process to darken the edges.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":168.58,"center_mean":177.92,"falloff_pct":5.25}

### [sev 3] lighting @ t=10.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep shadows in the crevices between tiles, creating high contrast.
- **B:** Bright, washed-out shadows between tiles, resulting in low contrast.
- **Fix (advisory):** Increase shadow depth and contrast in render settings.
- **Measurement:** {"p01":32.26,"p1":91.11,"p5":97.95,"p50":210.07,"p95":236.9,"p99":240.58,"p999":250.79,"span_p5_p95":138.95} vs {"p01":61.86,"p1":62.94,"p5":68.16,"p50":194.31,"p95":212.43,"p99":216.8,"p999":240,"span_p5_p95":144.27}

### [sev 3] color @ t=10.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The Recurly card has a warm, saturated golden-yellow color.
- **B:** The Recurly card has a cooler, less saturated yellow hue with a prominent grey bevel.
- **Fix (advisory):** Adjust the material color of the Recurly card to a warmer yellow and reduce the bevel width.
- **Measurement:** {"r":188.04,"g":199.03,"b":197.63,"rb_delta":-9.59,"saturation":0.2367} vs {"r":169.16,"g":179.23,"b":190.79,"rb_delta":-21.63,"saturation":0.2662}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

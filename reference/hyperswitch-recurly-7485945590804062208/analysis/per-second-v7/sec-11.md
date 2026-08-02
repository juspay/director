# Second 11 — original frames 330-359

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera distance and field of view to correct the framing of the scene.

## Verified / surviving claims
### [sev 3] camera @ t=11.50s — 2/3 runs — **MEASURED ✓**
- **A:** Camera is closer to the tiles, framing the buttons tightly.
- **B:** Camera is much further away, showing a very wide view of the tiles.
- **Fix (advisory):** Adjust camera distance and field of view to match the reference framing.
- **Measurement:** {"lap_var":342.53} vs {"lap_var":42.19}

### [sev 3] lighting @ t=11.50s — 3/3 runs — **MEASURED ✓**
- **A:** Deep shadows under the cards create strong contrast.
- **B:** Faint, washed-out shadows reduce contrast.
- **Fix (advisory):** Deepen shadows and increase contrast.
- **Measurement:** {"p01":5.74,"p1":85.8,"p5":90.3,"p50":209.07,"p95":230.56,"p99":236.33,"p999":251.64,"span_p5_p95":140.26} vs {"p01":60.08,"p1":62.14,"p5":66.95,"p50":192.8,"p95":209.67,"p99":213.88,"p999":239.3,"span_p5_p95":142.72}

## Killed in verification
### [sev 2] color @ t=11.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Tiles have a warm off-white tone and the Recurly button is a saturated yellow.
- **B:** Tiles are stark white and the Recurly button is a cooler, less saturated yellow.
- **Fix (advisory):** Adjust color grading to introduce warmer tones to the scene.
- **Measurement:** {"r":193.46,"g":203.74,"b":200.33,"rb_delta":-6.87,"saturation":0.1922} vs {"r":165.83,"g":175.29,"b":190.47,"rb_delta":-24.64,"saturation":0.2194}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

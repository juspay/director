# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera distance and angle to match the close-up framing of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=12.10s — 2/3 runs — **MEASURED ✓**
- **A:** The camera is positioned closer to the yellow card, creating a more dynamic perspective.
- **B:** The camera is further away, resulting in a flatter perspective and smaller card size.
- **Fix (advisory):** Adjust camera distance and angle to match the reference framing.
- **Measurement:** {"lap_var":440.46} vs {"lap_var":42.97}

### [sev 3] color @ t=12.20s — 3/3 runs — **MEASURED ✓**
- **A:** The overall image has a warm, yellowish color cast, especially visible on the white cards.
- **B:** The image has a neutral to cool white color cast with very little warmth.
- **Fix (advisory):** Add a warm color temperature adjustment or warm ambient light to match the reference.
- **Measurement:** {"r":194.49,"g":204.8,"b":200.59,"rb_delta":-6.1,"saturation":0.1879} vs {"r":165.5,"g":175.02,"b":190.8,"rb_delta":-25.29,"saturation":0.2211}

## Killed in verification
### [sev 3] lighting @ t=12.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, dark shadows are present in the gaps between the cards, creating high contrast.
- **B:** The gaps between the cards are brightly lit with minimal shadow depth, resulting in low contrast.
- **Fix (advisory):** Increase shadow intensity or add ambient occlusion to darken the gaps between the cards.
- **Measurement:** {"p01":4.04,"p1":86.3,"p5":91.09,"p50":208.88,"p95":231.19,"p99":236.33,"p999":252.45,"span_p5_p95":140.1} vs {"p01":60.08,"p1":61.43,"p5":66.01,"p50":192.3,"p95":209.09,"p99":213.31,"p999":239.5,"span_p5_p95":143.08}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

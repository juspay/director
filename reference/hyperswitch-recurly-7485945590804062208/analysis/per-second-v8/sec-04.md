# Second 4 — original frames 120-149

_2/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the color of the yellow button to match the warm golden hue and increase the intensity and softness of the contact shadows under the cards.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=4.50s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, soft contact shadows are visible beneath the cards.
- **B:** The contact shadows beneath the cards are extremely faint.
- **Fix (advisory):** Increase the intensity and softness of the contact shadows under the cards.
- **Measurement:** {"p01":64.21,"p1":76.5,"p5":133.38,"p50":208.3,"p95":245.71,"p99":249.14,"p999":251.01,"span_p5_p95":112.33} vs {"p01":80.65,"p1":102.69,"p5":126.89,"p50":206.8,"p95":223.81,"p99":228.81,"p999":253.86,"span_p5_p95":96.92}

### [sev 3] color @ t=4.95s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow button has a warm golden-yellow hue.
- **B:** The yellow button has a cooler, greenish-yellow hue.
- **Fix (advisory):** Adjust the color of the yellow button to match the warm golden hue of the reference.
- **Measurement:** {"r":197.85,"g":204.38,"b":188,"rb_delta":9.85,"saturation":0.2148} vs {"r":194.69,"g":193.58,"b":173.75,"rb_delta":20.94,"saturation":0.2405}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

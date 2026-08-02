# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Match the vibrant color palette and high-contrast glossy lighting of the reference tiles.

## Verified / surviving claims
### [sev 3] color @ t=4.20s — 3/3 runs — **MEASURED ✓**
- **A:** Vibrant blue and yellow background tiles surround the central white tile.
- **B:** Background tiles are desaturated grey and white, lacking color.
- **Fix (advisory):** Add vibrant blue and yellow colors to the background tiles.
- **Measurement:** {"r":191.1,"g":203.02,"b":212.64,"rb_delta":-21.55,"saturation":0.1231} vs {"r":192.87,"g":194.52,"b":199.31,"rb_delta":-6.45,"saturation":0.0588}

### [sev 3] lighting @ t=4.50s — 3/3 runs — **MEASURED ✓**
- **A:** Strong contrast with deep shadows between the cards and soft contact shadows under the icons.
- **B:** Very flat lighting with almost no shadows, making the cards and icons look two-dimensional.
- **Fix (advisory):** Adjust the lighting setup to introduce stronger directional light and enable ambient occlusion or contact shadows.
- **Measurement:** {"p01":64.21,"p1":76.5,"p5":133.38,"p50":208.3,"p95":245.71,"p99":249.14,"p999":251.01,"span_p5_p95":112.33} vs {"p01":72.24,"p1":95.11,"p5":166.08,"p50":193.49,"p95":215.74,"p99":217.8,"p999":253.86,"span_p5_p95":49.66}

## Killed in verification
### [sev 2] color @ t=4.95s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow 'Recurly' card has a highly saturated, warm golden-yellow color.
- **B:** The yellow card has a duller, cooler yellow color with a slight greenish cast.
- **Fix (advisory):** Adjust the material color of the Recurly card to be more saturated and warmer.
- **Measurement:** {"r":197.85,"g":204.38,"b":188,"rb_delta":9.85,"saturation":0.2148} vs {"r":181.96,"g":182.89,"b":167.24,"rb_delta":14.72,"saturation":0.2266}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

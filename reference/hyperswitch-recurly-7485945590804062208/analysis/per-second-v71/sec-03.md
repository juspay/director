# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera distance and focal length to achieve the tight framing of the reference, and enhance the lighting with soft shadows and a vignette to create depth.

## Verified / surviving claims
### [sev 3] lighting @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** Stronger contrast with soft shadows cast between the tiles and a visible vignette.
- **B:** Flat lighting with minimal shadows and no vignette, making the tiles look flat.
- **Fix (advisory):** Adjust the lighting setup to cast softer, deeper shadows between the tiles and add a vignette.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":72.53,"p1":97.33,"p5":123.89,"p50":199.59,"p95":221.88,"p99":223.96,"p999":254,"span_p5_p95":97.99}

### [sev 5] material @ t=3.50s — 2/3 runs — **MEASURED ✓**
- **A:** The tiles have rounded bevelled edges that catch soft specular highlights, giving them a 3D plastic feel.
- **B:** The tiles have flat, sharp edges with no specular highlights, making them look flat and 2D.
- **Fix (advisory):** Increase the bevel radius on the tile geometry and adjust the material roughness to catch highlights.
- **Measurement:** {"p01":53.2,"p1":66.36,"p5":80.46,"p50":218.32,"p95":249.29,"p99":250.14,"p999":253.22,"span_p5_p95":168.83} vs {"p01":67.26,"p1":75.67,"p5":106.46,"p50":218.09,"p95":222.81,"p99":252.14,"p999":254.86,"span_p5_p95":116.35}

## Killed in verification
### [sev 3] camera @ t=3.20s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera perspective is highly dynamic, showing strong foreshortening on the tiles.
- **B:** The camera perspective is flatter, making the tiles appear more uniform and parallel.
- **Fix (advisory):** Adjust the camera focal length and position to match the reference perspective.
- **Channel B:** The claim is reversed: Clip A shows a flatter perspective where the tiles appear more uniform and parallel, whereas Clip B shows a dynamic perspective with strong foreshortening as the tiles recede into the background.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

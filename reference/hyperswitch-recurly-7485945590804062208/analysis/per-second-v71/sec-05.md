# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Realign the camera angle and recreate the grid layout to match the reference perspective and composition.

## Verified / surviving claims
### [sev 3] layout @ t=5.20s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The Recurly card is surrounded by light gray tiles with a dark recessed border.
- **B:** A large yellow block is visible on the left, and the recess border is thick and light gray.
- **Fix (advisory):** Align tile layout and recess border thickness with the reference.
- **Channel B:** The visual details described in both claims match the clips. In Clip A, the yellow Recurly card is surrounded by light gray tiles with a dark recessed border. In Clip B, there is a large yellow block extending to the left of the Recurly card, and the recess border around the card is thick and light gray.

### [sev 3] camera @ t=5.40s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera angle is tilted, showing three-dimensional depth.
- **B:** The camera angle is flatter and more top-down, reducing depth.
- **Fix (advisory):** Adjust the camera tilt and perspective to match the reference.
- **Channel B:** Clip A shows a highly tilted, oblique camera angle that emphasizes the three-dimensional depth and shadows of the elements. In contrast, Clip B uses a much flatter, more top-down camera angle, which significantly reduces the sense of depth.

## Killed in verification
### [sev 3] lighting @ t=5.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, soft ambient occlusion shadows are visible in the crevices between the tiles.
- **B:** The crevices between tiles have weak, washed-out shadows with less definition.
- **Fix (advisory):** Increase ambient occlusion or shadow depth to match the reference.
- **Measurement:** {"p01":46.07,"p1":70.93,"p5":106.1,"p50":203.67,"p95":246.28,"p99":247.21,"p999":248.71,"span_p5_p95":140.18} vs {"p01":20.76,"p1":104.05,"p5":111.98,"p50":190.82,"p95":202.31,"p99":214.67,"p999":215.89,"span_p5_p95":90.33}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

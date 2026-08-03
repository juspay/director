# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera distance and focal length to match the tighter framing of the reference, and increase key light intensity and shadow density to deepen the contact shadows.

## Verified / surviving claims
### [sev 3] camera @ t=3.20s — 2/3 runs — **MEASURED ✓**
- **A:** The 'Secure Payments' card is framed closely, dominating the center of the screen.
- **B:** The camera is positioned further away, showing a wider view of the surrounding card grid.
- **Fix (advisory):** Adjust the camera distance and focal length to match the tighter framing of the reference.
- **Measurement:** {"lap_var":280.63} vs {"lap_var":32.92}

### [sev 3] lighting @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** The shadows cast beneath the cards are deep and sharp, creating high contrast.
- **B:** The shadows are faint and soft, resulting in a flatter overall image.
- **Fix (advisory):** Increase key light intensity and adjust shadow density to deepen the contact shadows.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":84.15,"p1":110.98,"p5":165.95,"p50":208.8,"p95":235.67,"p99":239.17,"p999":254.07,"span_p5_p95":69.72}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

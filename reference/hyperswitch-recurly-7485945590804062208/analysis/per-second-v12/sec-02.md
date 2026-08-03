# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Reposition the camera closer to the main tiles to match the tight framing and shallow depth of field of Video A.

## Verified / surviving claims
### [sev 3] lighting @ t=2.60s — 2/3 runs — **MEASURED ✓**
- **A:** The shadows cast by the cards are deep and well-defined, creating high contrast.
- **B:** The shadows are very soft and faint, resulting in a flat appearance.
- **Fix (advisory):** Increase the key light intensity and reduce ambient fill to deepen the shadows.
- **Measurement:** {"p01":66.56,"p1":78.72,"p5":109.33,"p50":205.94,"p95":246.21,"p99":249,"p999":251.66,"span_p5_p95":136.88} vs {"p01":83.94,"p1":112.54,"p5":166.73,"p50":210.08,"p95":238.24,"p99":242.17,"p999":254.07,"span_p5_p95":71.51}

## Killed in verification
### [sev 3] camera @ t=2.10s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The background card 'Renewal Success' is heavily blurred due to shallow depth of field.
- **B:** The background card 'Renewal Success' is sharp and clearly legible.
- **Fix (advisory):** Reduce the camera f-stop to narrow the depth of field and blur the background.
- **Measurement:** {"lap_var":92.84} vs {"lap_var":13.92}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

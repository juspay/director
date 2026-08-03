# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Model the metallic frame around the blue button and adjust the camera zoom to match the reference.

## Verified / surviving claims
### [sev 3] camera @ t=6.20s — 3/3 runs — **MEASURED ✓**
- **A:** The yellow button is framed in a tight close-up, occupying most of the screen.
- **B:** The yellow button is framed from a wider angle and positioned lower.
- **Fix (advisory):** Adjust camera zoom and position to match the close-up framing.
- **Measurement:** {"p01":47.93,"p1":70.57,"p5":102.59,"p50":206.64,"p95":245.55,"p99":246.7,"p999":248.37,"span_p5_p95":142.96} vs {"p01":48.81,"p1":113.13,"p5":119.49,"p50":209.81,"p95":220.16,"p99":226.18,"p999":233.39,"span_p5_p95":100.67}

### [sev 3] material @ t=6.80s — 2/3 runs — **MEASURED ✓**
- **A:** The recess frame around the blue 'Juspay' button has a brushed metallic texture.
- **B:** The recess frame around the blue button is a flat matte grey material.
- **Fix (advisory):** Add a brushed metal shader to the recess frame surrounding the Juspay button.
- **Measurement:** {"lap_var":565.17} vs {"lap_var":37.23}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

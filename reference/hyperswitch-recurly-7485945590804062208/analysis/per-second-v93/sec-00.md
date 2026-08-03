# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position and angle to match the reference perspective.

## Verified / surviving claims
### [sev 3] color @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** The white keys have a subtle cool blue tint, and the blue shield icon is a vibrant, saturated blue.
- **B:** The white keys are flat grey/white, and the blue shield icon is desaturated.
- **Fix (advisory):** Adjust the color grading to increase saturation and add a cool blue cast to the highlights.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":196.99,"g":202.61,"b":215.59,"rb_delta":-18.6,"saturation":0.085}

### [sev 3] lighting @ t=0.80s — 2/3 runs — **MEASURED ✓**
- **A:** Deep contact shadows under the tiles.
- **B:** Faint, washed-out shadows under the tiles.
- **Fix (advisory):** Deepen contact shadows.
- **Measurement:** {"p01":56.27,"p1":82.9,"p5":94.84,"p50":207.25,"p95":237.3,"p99":249.37,"p999":251.01,"span_p5_p95":142.46} vs {"p01":93.94,"p1":110.56,"p5":118.06,"p50":206.52,"p95":222.81,"p99":224.81,"p999":253.44,"span_p5_p95":104.75}

## Killed in verification
### [sev 3] camera @ t=0.20s — 3/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Camera is closer to the center tile with a steep perspective angle.
- **B:** Camera is further back with a flatter, more top-down angle.
- **Fix (advisory):** Match camera position and angle.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a close-up shot of the 'Secure Payments' tile with a steep, dynamic perspective angle, while Clip B is shot from further back with a flatter, more top-down perspective.
- **Channel A (Claude):** refuted — Stale distance-family claim: framing at parity since pass 8; B's elevation is if anything steeper, not 'flatter'.

### [sev 2] lighting @ t=0.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette darkening the corners.
- **B:** Flat, uniform lighting across the corners.
- **Fix (advisory):** Add corner vignette.
- **Measurement:** {"corner_mean":202.03,"center_mean":205.44,"falloff_pct":1.66} vs {"corner_mean":186.37,"center_mean":213.03,"falloff_pct":12.52}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

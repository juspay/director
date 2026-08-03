# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Add camera depth of field and a vignette to replicate the cinematic look of the reference.

## Verified / surviving claims
### [sev 2] material @ t=4.10s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The background plate on the right exhibits a brushed metal texture with horizontal grain.
- **B:** The background plate on the right is a smooth matte grey surface.
- **Fix (advisory):** Apply a brushed metal material to the right background plate.
- **Channel B:** In Clip A, the background plate on the right clearly shows a brushed metal texture with horizontal grain, whereas in Clip B, the corresponding background plate is a smooth, matte grey surface.

## Killed in verification
### [sev 2] color @ t=4.30s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Cool blue color cast on white surfaces.
- **B:** Neutral white surfaces.
- **Fix (advisory):** Add cool blue tint to whites.
- **Measurement:** {"r":191.52,"g":203.34,"b":213.03,"rb_delta":-21.51,"saturation":0.123} vs {"r":195.75,"g":201.71,"b":216.32,"rb_delta":-20.57,"saturation":0.1784}

### [sev 3] lighting @ t=4.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are darker than the center, creating a vignette.
- **B:** The frame is uniformly lit with no corner falloff.
- **Fix (advisory):** Apply a vignette to match the reference lighting.
- **Measurement:** {"corner_mean":202.05,"center_mean":199.03,"falloff_pct":-1.52} vs {"corner_mean":196.49,"center_mean":206.82,"falloff_pct":4.99}

### [sev 3] camera @ t=4.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Shallow depth of field with blurred top and bottom cards.
- **B:** Entire frame is in sharp focus.
- **Fix (advisory):** Enable depth of field and adjust aperture.
- **Measurement:** {"lap_var":67.31} vs {"lap_var":3.43}

### [sev 2] lighting @ t=4.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Soft, diffuse shadows under the cards.
- **B:** Hard-edged, dark shadows under the cards.
- **Fix (advisory):** Increase light source size to soften shadows.
- **Measurement:** {"p01":61.48,"p1":75.73,"p5":123.54,"p50":207.73,"p95":246.31,"p99":249.29,"p999":251.15,"span_p5_p95":122.77} vs {"p01":61.54,"p1":95.9,"p5":162.38,"p50":203.48,"p95":225.68,"p99":229.89,"p999":254.28,"span_p5_p95":63.3}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

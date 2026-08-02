# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera angle and framing to match the reference perspective, as the current steep diagonal angle significantly alters the composition.

## Verified / surviving claims
### [sev 3] color @ t=0.50s — 3/3 runs — **MEASURED ✓**
- **A:** Vibrant blue and yellow colors are visible on the tiles.
- **B:** The tiles are desaturated and appear mostly grey.
- **Fix (advisory):** Increase color saturation to match the reference.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":198.34,"g":203.67,"b":215.2,"rb_delta":-16.85,"saturation":0.0771}

## Killed in verification
### [sev 3] camera @ t=0.20s — 3/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Camera is close to the central tile with a dynamic perspective.
- **B:** Camera is further back with a flatter perspective.
- **Fix (advisory):** Match camera focal length and position.
- **Channel B (Gemini):** supported — Clip A shows a close-up view of the 'Secure Payments' tile with a dynamic perspective that shifts as the camera moves. Clip B shows the camera positioned further back, capturing more of the surrounding tiles with a flatter, more orthographic perspective.
- **Channel A (Claude):** refuted — B's subject is at comparable proximity and its perspective is steep top-down like A's — not 'further back with flatter perspective'. The true residual at t=0.5 is type rotated ~35deg at the sweep extreme, which is not this claim.

### [sev 3] lighting @ t=0.80s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners.
- **B:** Flat, uniform lighting across the frame.
- **Fix (advisory):** Add vignette falloff.
- **Measurement:** {"corner_mean":204.05,"center_mean":203.81,"falloff_pct":-0.11} vs {"corner_mean":181.76,"center_mean":212.89,"falloff_pct":14.62}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

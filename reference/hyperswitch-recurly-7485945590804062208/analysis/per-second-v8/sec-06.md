# Second 6 — original frames 180-209

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera framing and perspective angles in both shots to match the dynamic isometric composition of the reference.

## Verified / surviving claims
### [sev 2] lighting @ t=6.80s — 2/3 runs — **MEASURED ✓**
- **A:** Deep shadows and high contrast on and around the blue card.
- **B:** Faint shadows and lower contrast on and around the blue card.
- **Fix (advisory):** Increase shadow depth and overall contrast.
- **Measurement:** {"p01":54.34,"p1":67.8,"p5":74.53,"p50":203.97,"p95":246.13,"p99":247.85,"p999":253.23,"span_p5_p95":171.6} vs {"p01":60.95,"p1":61.74,"p5":63.45,"p50":193.59,"p95":216.72,"p99":218.48,"p999":254.15,"span_p5_p95":153.27}

## Killed in verification
### [sev 3] camera @ t=6.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The camera is positioned closer with a stronger perspective tilt, creating a dynamic 3D depth.
- **B:** The camera is further away with a flatter angle, making the layout appear more two-dimensional.
- **Fix (advisory):** Adjust camera position and focal length to match the reference's perspective.
- **Measurement:** {"corner_mean":194.13,"center_mean":166.36,"falloff_pct":-16.7} vs {"corner_mean":201.34,"center_mean":182.83,"falloff_pct":-10.12}

### [sev 2] lighting @ t=6.25s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger corner vignette and shadow depth around the cards.
- **B:** Flat, uniform lighting with minimal vignette.
- **Fix (advisory):** Add corner vignette and increase shadow contrast.
- **Measurement:** {"corner_mean":193.88,"center_mean":167.09,"falloff_pct":-16.04} vs {"corner_mean":201.14,"center_mean":182.75,"falloff_pct":-10.06}

### [sev 3] camera @ t=6.80s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Close-up framing on the blue card.
- **B:** Wider framing with the blue card appearing smaller.
- **Fix (advisory):** Zoom in to match the close-up framing.
- **Channel B (Gemini):** supported — Clip A shows a close-up shot of the blue 'JUSPAY hyperswitch' card, which occupies a larger portion of the frame. Clip B shows a wider shot where the blue card is smaller and more of the surrounding elements are visible.
- **Channel A (Claude):** refuted — B's blue card occupies a larger fraction of frame than A's at this beat (~72% vs ~66% width measured in the pass-7 cycle; pass-8 framing unchanged here). Not wider.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

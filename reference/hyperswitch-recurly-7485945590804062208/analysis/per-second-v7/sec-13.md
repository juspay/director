# Second 13 — original frames 390-419

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera perspective and enhance contact shadows to match the reference.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=13.00s — 1/1 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Camera is closer to the buttons with a dynamic, low-angle perspective.
- **B:** Camera is further away with a flatter, more orthographic perspective.
- **Fix (advisory):** Adjust camera focal length and position to match the reference perspective.
- **Channel B (Gemini):** supported — Clip A shows a closer view of the buttons with a dynamic, low-angle background perspective, while Clip B shows a wider, further-away view with a flatter, more orthographic grid perspective.
- **Channel A (Claude):** refuted — Both A and B shoot the lockup flat top-down — A has no 'dynamic low-angle perspective' at 13.x, so the claim's A half is false; and B's cards measure BIGGER than A's here (~290 vs ~250px).

### [sev 2] lighting @ t=13.50s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignette with distinct darkening towards the corners.
- **B:** Flat lighting with minimal corner falloff.
- **Fix (advisory):** Add a vignette effect to darken the corners.
- **Measurement:** {"corner_mean":209.4,"center_mean":193.52,"falloff_pct":-8.2} vs {"corner_mean":177.33,"center_mean":176,"falloff_pct":-0.76}

### [sev 3] staging @ t=13.20s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** Pronounced contact shadows cast by the buttons onto the tiles.
- **B:** Faint contact shadows, making the buttons appear flat.
- **Fix (advisory):** Increase ambient occlusion and contact shadow strength.
- **Measurement:** {"p01":3.85,"p1":86.13,"p5":89.3,"p50":208.88,"p95":231.41,"p99":236.33,"p999":252.37,"span_p5_p95":142.11} vs {"p01":60.08,"p1":60.93,"p5":66.01,"p50":191.94,"p95":208.88,"p99":213.24,"p999":239.52,"span_p5_p95":142.87}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

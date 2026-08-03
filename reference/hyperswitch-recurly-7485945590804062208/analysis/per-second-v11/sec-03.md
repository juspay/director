# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Apply a brushed metal material to the right-side panel and adjust lighting to restore high-contrast shadows and a vignette.

## Verified / surviving claims
### [sev 3] material @ t=3.50s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The vertical strip to the right of the cards has a brushed metal material with anisotropic reflections.
- **B:** The vertical strip is a flat, matte grey material with no metallic texture.
- **Fix (advisory):** Apply a brushed metal material with anisotropic reflections to the right side of the card container.
- **Channel B (Gemini):** supported — The claim accurately describes the visual differences between the vertical strip to the right of the cards in both clips. In Clip A, it has a distinct brushed metal texture with anisotropic reflections, whereas in Clip B, it is a flat, matte grey material with no metallic texture.
- **Channel A (Claude):** supported — Brushed strip family, third confirmation.

### [sev 3] lighting @ t=3.50s — 2/3 runs — **MEASURED ✓**
- **A:** Deep, high-contrast shadows are cast by the cards onto the floor.
- **B:** Shadows are extremely soft and faint, showing low contrast.
- **Fix (advisory):** Increase light intensity and shadow hardness.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":75.81,"p1":99.68,"p5":121.41,"p50":198.74,"p95":217.68,"p99":219.39,"p999":251.29,"span_p5_p95":96.27}

## Killed in verification
### [sev 3] lighting @ t=3.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center, showing a strong vignette.
- **B:** The corners of the frame are almost as bright as the center, with no visible vignette.
- **Fix (advisory):** Add a vignette effect to darken the corners of the frame.
- **Measurement:** {"corner_mean":202.31,"center_mean":199.95,"falloff_pct":-1.18} vs {"corner_mean":173.47,"center_mean":200.58,"falloff_pct":13.51}

## Present in A, absent in B (corroborated, unverified inventory)
- brushed metal texture on the right side
- yellow tile in the top-left background

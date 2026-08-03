# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply the dot pattern texture to the left panel material and adjust the lighting to create deeper shadows.

## Verified / surviving claims
### [sev 4] material @ t=3.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** A grid of small grey dots is visible on the left background panel.
- **B:** The left background panel is completely plain white with no dots.
- **Fix (advisory):** Apply the dot pattern texture to the left panel material.
- **Channel B:** In Clip A, a grid of small grey dots is clearly visible on the left background panel next to the cards. In Clip B, the corresponding panel on the left is plain white and does not contain any dots.

### [sev 3] lighting @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** The shadows cast by the rounded blocks are deep and well-defined, creating high contrast.
- **B:** The shadows are very faint and washed out, resulting in a much flatter appearance.
- **Fix (advisory):** Adjust the key and ambient light intensity to deepen the shadows and match the reference contrast.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":63.4,"p1":96.55,"p5":169.94,"p50":214.45,"p95":239.17,"p99":241.03,"p999":253.86,"span_p5_p95":69.23}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
- left_panel_dot_pattern

# Second 3 — original frames 90-119

_3/3 runs passed the ground-truth timing check; 5 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Add a brushed metal material to the background plate to match the metallic texture and anisotropic reflections of the reference.

## Verified / surviving claims
### [sev 3] lighting @ t=3.50s — 3/3 runs — **MEASURED ✓**
- **A:** Strong directional lighting creates soft, realistic drop shadows behind the cards.
- **B:** Flat, ambient lighting results in extremely faint shadows, making the cards look pasted on.
- **Fix (advisory):** Add a directional light source to cast soft drop shadows behind the cards.
- **Measurement:** {"p01":61.56,"p1":75.51,"p5":122.88,"p50":204.54,"p95":246.64,"p99":249.22,"p999":252.08,"span_p5_p95":123.76} vs {"p01":79.8,"p1":101.26,"p5":122.41,"p50":202.74,"p95":219.18,"p99":221.61,"p999":253.58,"span_p5_p95":96.77}

### [sev 4] material @ t=3.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** A brushed metal texture with horizontal anisotropic specular highlights is visible on the right side of the frame.
- **B:** The surface is flat matte grey with no metallic texture or anisotropic reflections.
- **Fix (advisory):** Apply a brushed metal material with anisotropic filtering to the background plate.
- **Channel B (Gemini):** supported — Clip A clearly shows a brushed metal texture with horizontal anisotropic specular highlights on the right side of the frame, whereas in Clip B, the corresponding surface is a flat matte grey with no metallic texture or reflections.
- **Channel A (Claude):** supported — A's brushed surfaces show strong directional texture with anisotropic highlights; B's metal tiles are far subtler.

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
- brushed metal texture on the right

# Second 6 — original frames 180-209

_2/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Realign the camera angle and tile layout, and adjust ambient occlusion to deepen shadows in the crevices.

## Verified / surviving claims
### [sev 3] staging @ t=6.20s — 2/2 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The yellow Recurly tile is surrounded by a dark grey well, and the Secure Payments tile is visible on the left.
- **B:** The yellow Recurly tile is surrounded by a light grey well, and the Secure Payments tile is visible on the top-left.
- **Fix (advisory):** Realign the camera angle and adjust the tile layout to match the reference staging.
- **Channel B (Gemini):** supported — The visual details in both clips match the description. In Clip A, the Recurly tile sits in a dark grey well, and the Secure Payments tile is on the left. In Clip B, the well is a lighter grey with horizontal lines, and the Secure Payments tile is positioned at the top-left.
- **Channel A (Claude):** supported — A's well is dark graphite with heavy brush texture; B's bezel is light blue-grey. Large, obvious tone gap.

## Killed in verification
### [sev 3] lighting @ t=6.80s — 2/2 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows in the crevices around the blue JUSPAY tile are dark and pronounced.
- **B:** The shadows in the crevices around the blue JUSPAY tile are faint and washed out.
- **Fix (advisory):** Adjust the ambient occlusion and shadow settings to deepen the crevices.
- **Measurement:** {"p01":54.34,"p1":67.8,"p5":74.53,"p50":203.97,"p95":246.13,"p99":247.85,"p999":253.23,"span_p5_p95":171.6} vs {"p01":12.02,"p1":48.67,"p5":53.51,"p50":170.26,"p95":212.31,"p99":214.31,"p999":254.5,"span_p5_p95":158.8}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

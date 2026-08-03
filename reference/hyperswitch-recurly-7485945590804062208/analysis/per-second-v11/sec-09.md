# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera distance and focal length to match the reference framing, and deepen the contact shadows to restore depth.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=9.20s — 3/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned closer to the grid, making the cards appear larger with a distinct perspective angle.
- **B:** The camera is positioned further away, resulting in smaller cards and a flatter perspective.
- **Fix (advisory):** Move the camera closer and adjust the focal length to match the reference framing.
- **Channel B (Gemini):** supported — The comparison is accurate. Clip A shows a close-up view of the grid with larger cards and a more pronounced perspective angle, while Clip B shows a wider shot with smaller cards and a flatter perspective.
- **Channel A (Claude):** refuted — Lockup parity family.

### [sev 3] lighting @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep, defined contact shadows are visible beneath the cards, creating depth.
- **B:** Shadows are extremely faint and diffuse, making the scene look flat.
- **Fix (advisory):** Increase contact shadow intensity and ambient occlusion.
- **Measurement:** {"p01":62.41,"p1":94.19,"p5":107.96,"p50":202.15,"p95":246.35,"p99":249.79,"p999":253,"span_p5_p95":138.39} vs {"p01":62.37,"p1":63.51,"p5":69.88,"p50":172.2,"p95":191.05,"p99":197.32,"p999":245.86,"span_p5_p95":121.17}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 9 — original frames 270-299

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position and focal length to match the close-up framing of the reference video.

## Verified / surviving claims
### [sev 2] color @ t=9.50s — 3/3 runs — **MEASURED ✓**
- **A:** Warm, neutral color balance with natural white tones.
- **B:** Cool blue-grey color cast across the entire frame.
- **Fix (advisory):** Adjust white balance and color grading to eliminate the cool cast.
- **Measurement:** {"r":187.83,"g":198.44,"b":204.9,"rb_delta":-17.08,"saturation":0.1734} vs {"r":163.82,"g":172.61,"b":187.35,"rb_delta":-23.53,"saturation":0.2283}

## Killed in verification
### [sev 3] camera @ t=9.20s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The camera is positioned closer to the tiles, framing 'Recurly' and 'hyperswitch' tightly.
- **B:** The camera is positioned much further back, showing a wider view of the surrounding tiles.
- **Fix (advisory):** Adjust camera position and focal length to match the close-up framing.
- **Channel B (Gemini):** supported — Clip A shows a close-up view of the 'Recurly' and 'hyperswitch' tiles, while Clip B shows a much wider shot with the camera positioned further back, revealing more of the surrounding tiles.
- **Channel A (Claude):** refuted — Card widths near-parity (A Recurly ~310px vs B ~300px of 720). 'Much further back, smaller cards' is pass-6's stale claim; the dolly fix landed. Channel B endorsed it against the pixels — correlated-error catch.

### [sev 2] lighting @ t=9.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The lighting has higher contrast with brighter highlights on the tile surfaces.
- **B:** The lighting is flatter with dimmer highlights and lower contrast.
- **Fix (advisory):** Increase key light intensity and adjust contrast curve.
- **Measurement:** {"p01":62.41,"p1":94.19,"p5":107.96,"p50":202.15,"p95":246.35,"p99":249.79,"p999":253,"span_p5_p95":138.39} vs {"p01":53.28,"p1":54.86,"p5":60.51,"p50":190.67,"p95":209.98,"p99":219.35,"p999":246.07,"span_p5_p95":149.47}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

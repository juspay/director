# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust camera framing and layout to match the reference composition.

## Verified / surviving claims
### [sev 2] material @ t=7.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The blue card's frame has a brushed metal texture with anisotropic reflections.
- **B:** The blue card's frame is a flat matte grey plastic.
- **Fix (advisory):** Use a metallic material with brushed texture for the card frame.
- **Channel B (Gemini):** supported — In Clip A, the frame around the blue 'JUSPAY hyperswitch' card clearly shows a brushed metal texture with anisotropic reflections that react to the light. In Clip B, the frame is a flat, matte grey material without any brushed texture or metallic reflections.
- **Channel A (Claude):** supported — A's plinth shows pronounced brushed striations with warm/cool reflection variation along the brushing direction. B's bezel reads as a near-uniform cool grey with only the faintest texture and no directional highlight response. B is not literally textureless, but the claimed difference is plainly visible.

## Killed in verification
### [sev 3] layout @ t=7.25s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The 'Revenue Analytics' tile is in the upper right and the 'PSP' tile is at the bottom center.
- **B:** The 'Revenue Analytics' tile is in the upper left-center and the 'PSP' tile is at the bottom left.
- **Fix (advisory):** Rearrange the background tiles to match the reference layout.
- **Channel B (Gemini):** supported — The visual layout of the tiles in both clips matches the description perfectly. In Clip A, 'Revenue Analytics' is in the upper right and 'PSP' is at the bottom center. In Clip B, 'Revenue Analytics' is in the upper left-center and 'PSP' is at the bottom left.
- **Channel A (Claude):** refuted — Revenue Analytics sits upper-RIGHT in BOTH frames (in B it is smaller, farther and angled, but clearly in the right half — not 'upper left-center'). The real positional difference is the PSP tile: bottom-centre in A vs clipped at the bottom-left edge in B. Half the claim is true, but as stated it is contradicted.

### [sev 2] lighting @ t=7.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deep shadows in the gaps between keys create high contrast.
- **B:** Gaps between keys are brightly lit, reducing contrast.
- **Fix (advisory):** Darken the contact shadows and gaps between keys.
- **Measurement:** {"p01":65.23,"p1":69.47,"p5":75.95,"p50":200.32,"p95":246.42,"p99":247.86,"p999":253.09,"span_p5_p95":170.47} vs {"p01":10.74,"p1":17.33,"p5":17.33,"p50":201.98,"p95":232.84,"p99":234.26,"p999":240,"span_p5_p95":215.51}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

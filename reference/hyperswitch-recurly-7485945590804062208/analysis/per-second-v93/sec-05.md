# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Add a vignette effect to darken the corners of the frame and increase the glossiness of the yellow button to restore specular highlights.

## Verified / surviving claims
### [sev 3] material @ t=5.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The yellow Recurly button exhibits a glossy finish with a distinct specular highlight.
- **B:** The yellow Recurly button has a flat, matte appearance with no specular highlights.
- **Fix (advisory):** Increase glossiness and adjust roughness of the yellow button material.
- **Channel B (Gemini):** supported — In Clip A, the yellow Recurly button has a clear glossy finish with a moving specular highlight reflection. In Clip B, the button is rendered with a flat, matte yellow material that does not show any specular highlights.
- **Channel A (Claude):** supported — A's Recurly cap is DOMED — its top face curves, carrying a broad specular sweep across the gold; B's is a flat slab with only edge bevels. This is the deepest remaining material difference and explains several sibling claims.

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners and pronounced soft shadows under the yellow Recurly card.
- **B:** Flat, uniform lighting across the frame with minimal corner falloff and very weak shadows under the card.
- **Fix (advisory):** Add a vignette effect and enable ambient occlusion to create deeper shadows under the cards.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":193.25,"center_mean":181.31,"falloff_pct":-6.59}

## Present in A, absent in B (corroborated, unverified inventory)
- glossy reflections on the yellow card

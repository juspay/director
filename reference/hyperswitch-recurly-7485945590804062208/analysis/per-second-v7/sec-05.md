# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera zoom, position, and focal length to match the perspective and framing of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=5.30s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is zoomed in close on the Recurly tile.
- **B:** The camera is pulled back, showing a wider view of the tiles.
- **Fix (advisory):** Adjust camera zoom and composition to match the reference.
- **Channel B (Gemini):** supported — The claim is accurate. In Clip A, the camera is zoomed in much closer to the yellow Recurly tile, making it appear larger and showing less of the surrounding grid. In Clip B, the camera is pulled back, showing a wider view of the tiles and the surrounding layout.
- **Channel A (Claude):** supported — A's Recurly hero is a close low dramatic macro with heavy edge falloff; B views a smaller flat card at an oblique distance.

### [sev 3] material @ t=5.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The yellow button features a reflective metallic bevel.
- **B:** The yellow button has a flat grey border with no metallic reflections.
- **Fix (advisory):** Apply a metallic material to the button's bevel.
- **Channel B (Gemini):** supported — The comparison is accurate. In Clip A, the yellow 'Recurly' button has a shiny, reflective metallic bevel around it, whereas in Clip B, it has a flat grey border with no reflections.
- **Channel A (Claude):** supported — A's gold face carries a specular gradient and a glossy bevel; B's yellow is UNIFORM — the face is an unlit toneMapped=false meshBasicMaterial and cannot respond to light. That unlit-faces architecture is a root cause of the persistent 'flat' readings, beyond the bezel.

## Killed in verification
### [sev 2] lighting @ t=5.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignette with noticeable darkening in the corners.
- **B:** Even lighting across the frame with minimal corner falloff.
- **Fix (advisory):** Increase vignette strength in post-processing.
- **Measurement:** {"corner_mean":194.33,"center_mean":164.65,"falloff_pct":-18.03} vs {"corner_mean":191.5,"center_mean":164.98,"falloff_pct":-16.08}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

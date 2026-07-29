# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 2 single-run claims discarded._

## Highest-impact fix
Adjust the camera to a low-angle perspective with shallow depth of field, add a metallic bezel frame with a brushed anisotropic shader to the JUSPAY card, and implement directional key lighting with soft contact shadows.

## Corroborated differences
### [sev 4] camera — 2/3 runs
- **A:** Uses a low-angle, close-up perspective with a shallow depth of field to create scale and depth.
- **B:** Uses a flatter, higher-angle perspective with a wider focal length and infinite depth of field, making the scene look flat.
- **Fix:** Lower the camera angle, push in closer, and enable depth of field with a wider aperture.

### [sev 4] material — 3/3 runs
- **A:** Renders a distinct brushed metallic bezel/frame surrounding the JUSPAY card.
- **B:** Renders the card as a flat blue rounded rectangle with a flat, textureless grey border.
- **Fix:** Model a metallic frame around the card with a physical inset and apply a brushed anisotropic metal shader.

### [sev 4] lighting — 3/3 runs
- **A:** Features soft, directional key lighting casting realistic contact shadows and ambient occlusion beneath the cards.
- **B:** Features flat, ambient-heavy lighting with weak or missing contact shadows.
- **Fix:** Add a strong, soft directional key light and enable high-resolution contact shadows and ambient occlusion.

### [sev 3] typography — 3/3 runs
- **A:** Displays the custom Hyperswitch logo icon (stylized crescent) and precise sans-serif branding.
- **B:** Displays a generic circular/circle-slash icon and an incorrect, heavier font weight.
- **Fix:** Import the correct vector assets for the Hyperswitch logo and match the font weight.

## Present in A, absent in B
- Brushed metal texture and beveled frame on the JUSPAY card's border.
- Custom Hyperswitch logo icon.
- Soft contact shadows and ambient occlusion beneath the cards.

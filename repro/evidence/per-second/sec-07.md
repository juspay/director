# Second 7 — frames 210..239

## 1. What actually animates in A this second
*   **Camera:** The camera performs a slow, continuous dolly right and a very slight truck in (move forward). This is visible by comparing the position of the "hyperswitch" block relative to the frame edges between f210 and f239. The motion is perfectly smooth, inferring a `linear` easing across a much longer shot.
*   **"Hyperswitch" Block:** The central blue block and its base are rising very slowly on the Y-axis. This is a subtle, continuous drift, likely with `linear` easing.
*   **Light/Shadows:** A soft, dappled shadow pattern drifts across the entire scene from top-left to bottom-right. This is most noticeable as it begins to cover the "PSP" block from f235 onwards. This suggests a light source being filtered by an animated texture or object off-camera, moving at a `linear` speed. The movement is independent of the camera.

## 2. What animates in B this second
*   Nothing. The shot is completely static.
*   **Absent from B:** All camera motion, the vertical drift of the hero object, and the animated, dappled light and shadow pass are entirely absent.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Static vs. Dynamic Scene:** A's scene feels alive due to the combination of a slow camera dolly and a subtle object drift. B is a dead still, which immediately reads as amateur. The lack of any movement makes the shot feel like a static render, not a moment in a film.
    *   **A does:** A slow, multi-axis camera move combined with a gentle, continuous object animation.
    *   **B does:** Nothing. The camera and all objects are locked.
    *   **B needs:** Implement a camera dolly right and truck-in over the full duration of the shot, matching the framing shift seen between A f210 and A f239. Add a slow, continuous upward drift to the main "hyperswitch" block assembly.

2.  **Environmental Motion:** A uses an animated, dappled shadow pass to suggest a world outside the frame and add visual complexity. This makes the lighting feel dynamic and natural. B's lighting is static and sterile.
    *   **A does:** Drifts a soft, low-contrast shadow pattern across the scene.
    *   **B does:** Has a single, fixed lighting setup.
    *   **B needs:** Create a large, soft gobo (a texture applied to a light) with a noise or foliage pattern. Animate this light or its texture coordinates to move slowly across the scene throughout the shot, casting very soft, low-opacity shadows.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Shading:** This is the primary reason B looks like a viewport render. A's lighting is soft, diffuse, and motivated, creating gentle gradients and very soft penumbras on shadows. There is significant bounce light and color bleed (e.g., the yellow blocks subtly warming the adjacent white surfaces). B uses a harsh, direct light source that creates sharp, unrealistic contact shadows and flattens all surfaces. There is no perceptible global illumination.
    *   **A looks photographed:** Because of large, soft light sources, global illumination, and a warm color temperature.
    *   **B looks like a viewport:** Because of a single, hard key light, no bounce light, and unnaturally sharp shadows.
    *   **B needs:** Delete the current lights. Replace them with a large area light positioned high and to the left, and enable global illumination (or path tracing) to get realistic light bounce and soft shadows. Add a subtle bloom/glare effect in post.

2.  **Materiality and Texture:** A's objects feel tactile. The white blocks have a matte, paper-like finish with microscopic imperfections. The base under the blue block has a visible grain or texture, like brushed metal or stacked paper (f225). B's materials are default shaders. The grey is a flat diffuse color, the blue is 100% saturated plastic, and the white is pure, textureless white.
    *   **A looks photographed:** Materials have subtle textures and roughness maps that catch light realistically.
    *   **B looks like a viewport:** Materials are simple, perfect, and lack surface detail.
    *   **B needs:** Add subtle procedural noise or grunge maps to the roughness channel of every material. The grey base needs a specific linear texture map. Desaturate the primary blue by at least 20%.

3.  **Depth of Field:** A has a shallow depth of field. The "hyperswitch" logo is the focal point, while the "Revenue Analytics" chip (top right) and "PSP" chip (bottom) are slightly out of focus (f239). This guides the eye and mimics a real lens. B is perfectly sharp from corner to corner, which is unnatural and distracting.
    *   **A looks photographed:** Uses shallow DoF to direct focus.
    *   **B looks like a viewport:** Has an infinite depth of field.
    *   **B needs:** Enable depth of field on the camera. Set the focus distance to the "hyperswitch" logo and use an aperture setting that produces a subtle but noticeable falloff on the foreground and background elements.

4.  **Composition and Typography:** A's composition is more balanced, with the hero element slightly off-center to create visual interest. The typography on the "Revenue Analytics" chip is a lighter weight and tracked out more than in B. B's framing is rigidly centered and static. The typography is heavier and tighter, looking more like default text. The "Billing" card at the bottom of B is an unmotivated, distracting element that unbalances the frame.
    *   **A looks designed:** Considered composition, refined typography.
    *   **B looks default:** Centered layout, basic type settings, cluttered elements.
    *   **B needs:** Match the font weight and tracking from A. Re-compose the shot to match A's off-center framing and remove the "Billing" card entirely.

## 5. The single highest-impact fix for this second
Scrap the default lighting and replace it with a large area light and global illumination to create the soft, diffuse shadows and subtle color bleed that define the reference's photographic quality.

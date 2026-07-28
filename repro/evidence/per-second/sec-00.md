# Second 0 — frames 0..29

## 1. What actually animates in A this second
*   **Camera:** A slow, continuous orbital move. From f0 to f29, the camera trucks slightly right and booms up, pivoting around a point near the center of the frame. The motion is perfectly linear, with no discernible easing in this segment.
*   **Objects:** The grid of tiles is entirely static. There is no object animation.
*   **Icon Micro-animation:** The "Renewal Success" icon's blue progress ring animates. It performs a slow, linear clockwise wipe, starting at roughly 75% complete at f0 and ending at ~85% complete at f29. The checkmark inside is static. The "Secure Payments" icon is static.
*   **Lighting/Reflections:** There is a significant light sweep or interaction with a complex reflection map. A broad, soft specular highlight travels from left to right across the brushed metal texture at the bottom of the frame (compare f0 to f29). A similar, softer highlight travels across the top beveled edge of the central "Secure Payments" tile. The shadows cast by the tiles subtly shift their angle and length, consistent with a moving light source.

## 2. What animates in B this second
*   **Camera:** A slow dolly-in combined with a boom-up. The camera starts further back and moves closer to the "Secure Payments" tile. The move has a very slow ease-in, barely moving in the first ~10 frames and accelerating towards the end of the second.
*   **Objects:** The "Secure Payments" tile animates up from below the frame, starting at f4 and settling with a slow ease-out around f20. The "Renewal Success" tile slides in from the top right.
*   **Icon Micro-animation:** None. All icons are static from the moment they appear.
*   **Lighting/Reflections:** None. The lighting is static. Shadows move only because the objects casting them are moving. There are no travelling highlights or reflections.

**Absent in B:** The "Renewal Success" ring animation is missing. The entire light/reflection sweep is missing. The camera's orbital character is missing.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Primary Camera Motion:** A uses a confident, steady, linear orbital move that reveals dimensionality. B uses a hesitant, slow ease-in dolly that feels weak and indecisive. The combination of camera dolly and object animation in B is clumsy and overly busy for an opening shot.
    *   **Change:** Replace B's camera and object animation entirely. The tiles should already be in place at f0. The camera should perform a linear orbital move matching the path and speed of A.
2.  **Secondary Motion (Lighting):** A's scene feels alive because of the moving highlights and shifting shadows. It adds a layer of dynamic complexity to an otherwise static scene. B's static lighting makes the objects feel dead and plasticky.
    *   **Change:** Animate a key light source (or the HDRI rotation) to move across the scene over the 30 frames, creating the travelling specular highlights seen in A.
3.  **Micro-animation:** A's subtle ring wipe on the "Renewal Success" icon is a small detail that adds polish and suggests the interface is "live". B's icons are just static pictures.
    *   **Change:** Animate the trim path of the "Renewal Success" ring to wipe from 75% to 85% over frames 0-29 with linear easing.

## 4. Design/render-craft differences (ranked)
1.  **Lighting & Shading:** This is the primary reason B looks like a viewport render. A uses soft, physically accurate lighting, likely from large area lights and an HDRI, creating very soft contact shadows and subtle gradients across surfaces. B's lighting is harsh and direct, creating unnaturally sharp, dark shadows with no softness or penumbra. A's materials have subtle roughness variation and fresnel effects, visible in the falloff at the edges. B's materials are flat, like a default diffuse shader.
    *   **Change:** Re-light the scene. Use an HDRI for global illumination and reflections. Use large area lights to create soft shadows. Increase shadow samples to remove noise. Build proper P-BR materials with roughness maps and a subtle fresnel effect on the dielectric tile surfaces.
2.  **Surface & Lens Realism:** A's surfaces have microscopic texture; the white tiles are not perfectly smooth but have a paper-like bump. The metal has a clear anisotropic/brushed texture that realistically catches the light. A also features subtle lens effects like chromatic aberration (see the top edge of the central tile in f0) and a hint of barrel distortion, which sells the "shot on a real camera" look. B's surfaces are mathematically perfect, and there are no lens effects.
    *   **Change:** Add a very fine noise/procedural bump map to the white tile material. Use an anisotropic shader for the metal. In post, add 1-2px of chromatic aberration and a -0.5% to -1% lens distortion.
3.  **Typography & Iconography:** A's typography is lighter, with tighter tracking, and the two-line text block is vertically centered next to the icon. B's font is too bold, the tracking is too loose, and the text is awkwardly bottom-aligned. A's icon has a subtle color gradient; B's is a flat, over-saturated blue.
    *   **Change:** Reduce font weight. Decrease tracking by 15-20%. Vertically center the "Secure Payments" text block relative to the shield icon. Add a subtle vertical gradient to the icon's fill color.

## 5. The single highest-impact fix for this second
Re-light the scene from scratch using large area lights and an HDRI to produce soft, physically-correct shadows and moving specular highlights.

# Second 13 — frames 390..419

## 1. What actually animates in A this second
-   **Camera:** A very slow, continuous camera drift moves up and slightly to the left throughout the entire second (f390-419). The motion is perfectly smooth, suggesting a `linear` ease over a much longer duration than this one-second clip.
-   **Background Light/Caustics:** The soft, out-of-focus light patterns on the background plane are in constant, slow motion. A warm, yellowish patch of light at the top of the frame drifts down and slightly right, while the cooler blue areas shift correspondingly. This is a `linear` animation, likely a large, soft procedural noise texture being translated across the scene or mapped to a light's color.
-   **Reflections:** The changing background light causes subtle shifts in the reflections and refractions on the semi-transparent panels holding the logos. This is most visible on the top edge of the Recurly panel. This movement is a direct consequence of the background animation and is therefore also `linear`.

## 2. What animates in B this second
Nothing. The frame is completely static from f390 to f419.

The following animations from A are entirely ABSENT in B:
-   Camera drift.
-   Animated background lighting/caustics.
-   Dynamic reflections/refractions.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Absence of Ambient Motion:** A feels alive because of a constant, subtle drift in both the camera and the lighting. This keeps the viewer's eye engaged and makes the scene feel like a physical space. B is completely static, which reads as a dead, amateur render. It's a still image, not a moment in time.
    -   **A does:** A slow, linear camera drift and a slow, linear animation of the background light texture.
    -   **B does:** Nothing. The shot is frozen.
    -   **B needs:** Add a camera drift of approximately 5-10 pixels over these 30 frames. Separately, animate the texture used for the background lighting to drift at a similar, but not identical, speed and direction to create parallax and a sense of depth.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Materiality:** This is the primary reason A looks photographed and B looks like a viewport render.
    -   **A's lighting** is soft, directional, and has color temperature variation (warm light from top-left, cool ambient fill). This creates gentle gradients across all surfaces. The background itself feels emissive and is the primary light source.
    -   **B's lighting** is flat, non-directional, and monochromatic (a dull, low-contrast cyan). There are no defined key or fill lights, resulting in a complete lack of form or depth.
    -   **A's materials:** The logo panels are frosted glass/acrylic, which realistically catch light, refract the background, and cast extremely soft, subtle contact shadows.
    -   **B's materials:** The logo panels use a nonsensical, tiled, brushed-metal texture. The background is a cluttered collage of sharp, distracting UI elements. This is a critical design failure.
    -   **Change needed:** Re-light the scene from scratch. Use large area lights to replicate the soft gradients. Introduce a warm key and cool fill. Replace the logo panel material with a translucent shader with a high roughness value. Replace the cluttered background with a simple plane and use a procedural noise texture in the emission/color channel to create the soft, out-of-focus light patterns seen in A.

2.  **Shadows and Depth:** A's elements feel layered and integrated because of its shadow treatment. B's elements feel like stickers on a flat image.
    -   **A does:** Uses incredibly soft, diffuse drop shadows that barely separate the panels from the background. There is a subtle, darker contact shadow right at the edge.
    -   **B does:** Uses a hard, dark, uniform drop shadow that looks like a default After Effects layer style. It creates an ugly, harsh outline and flattens the scene.
    -   **Change needed:** Drastically increase the softness of your shadow-casting lights (i.e., increase their physical size) or increase the radius of the shadows in the render settings. The shadow opacity should be reduced to 10-15%.

3.  **Typography and Layout:** The graphic design choices in B are clumsy.
    -   **A does:** The "Live Now" text is a lighter font weight, with clean tracking. The button's blue outline is thin and subtle. The logo panels have generous internal padding.
    -   **B does:** The "Live Now" text is too bold and tightly tracked. The button's outline is thick and overpowering. The logo holders have thick, heavy grey bezels that constrict the logos within them.
    -   **Change needed:** Match the font weight and tracking from A. Reduce the button's stroke width by at least 50%. Redesign the logo holders to be simple, edgeless frosted panels, not heavy-bordered frames.

## 5. The single highest-impact fix for this second
Rebuild the lighting and materials to match the reference—replace the flat ambient light and procedural textures with soft, directional area lights and simple frosted glass shaders to create depth and believability.

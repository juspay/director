# Second 10 — frames 300..329

## 1. What actually animates in A this second
*   **Camera:** A very slow, continuous camera dolly moves up and slightly right across the entire 30-frame sequence (f300-f329). The easing is linear; it's a constant, subtle drift with no acceleration.
*   **Lighting:** A soft, caustic-style light pattern drifts across the background tiles. The pattern moves from the bottom-right towards the top-left over 30 frames, also with linear easing.
*   **Shadows:** The soft shadows cast by the logo panels and the "Live Now" button subtly shift and change in intensity in response to the moving caustic light pattern. This movement is also linear.
*   **Reflections:** A broad, soft highlight travels slowly across the surface of the yellow "Recurly" panel from right to left. A similar, less defined highlight moves across the blue "Juspay" panel. This is a continuous, linear motion over 30 frames.

## 2. What animates in B this second
Nothing. The shot is a completely static render from f300 to f329.

The following are entirely ABSENT in B:
*   Camera motion.
*   Animated light patterns.
*   Shadow movement.
*   Travelling reflections.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Overall Motion vs. Static Hold:** A is a living shot with constant, subtle motion. B is a dead still. This is the primary reason it fails as motion design.
    *   **A:** A slow, linear camera drift and animated lighting keep the viewer engaged and give the scene a sense of place and physicality.
    *   **B:** The complete lack of motion makes the shot feel like a mistake, a frozen frame in an edit, or a pre-production still.
    *   **Change:** Implement a slow camera dolly across the entire shot. Do not ease-in or ease-out; it must be a constant, almost imperceptible drift.
2.  **Secondary Animation (Light/Reflections):** A uses animated light and reflections to define its materials. B has none.
    *   **A:** Light travels across surfaces, proving they are reflective and exist in a lit environment. This makes the materials feel real.
    *   **B:** The lighting is baked-on and static, making the objects feel like flat illustrations rather than 3D objects.
    *   **Change:** Create an animated light source. This can be a large area light with a procedural noise map in its texture slot, or a simple animated gobo, moving slowly and linearly throughout the shot.

## 4. Design/render-craft differences (ranked)
1.  **Lighting & Shadows:** This is the main reason B looks like a viewport render.
    *   **A:** Lighting is soft, diffuse, and complex, suggesting a large light source and global illumination. Shadows are extremely soft, feathered, and have realistic contact occlusion that is barely there. The scene has depth and atmosphere.
    *   **B:** Lighting is flat and direct. Shadows are hard-edged, overly dark, and uniform, like default raytraced shadows with no softness. They create a harsh, unrealistic outline around every object.
    *   **Change:** Delete your current lights. Use large area lights to create soft shadows. Drastically increase shadow samples or radius. Enable Global Illumination or Final Gather to simulate bounced light and eliminate the harsh contact shadows.
2.  **Material Definition:** A's materials have physical properties. B's are basic shaders.
    *   **A:** The background has a matte, slightly rough texture. The logo panels have a clear-coat layer over a diffuse base, creating broad, soft reflections. The metal bezels have a subtle brushed texture.
    *   **B:** The background is a flat colour with distracting low-opacity graphics. The logo panels are simple diffuse materials. The grey borders are a flat, dimensionless grey.
    *   **Change:** Build physically accurate, layered materials. Add subtle surface imperfections via roughness and bump maps. The background must have a texture. The panels need a specular/coat layer.
3.  **Lens & Camera Properties:** A feels photographed. B feels computer-generated.
    *   **A:** There is an extremely shallow depth of field, softening the background slightly. There is also a hint of chromatic aberration on high-contrast edges.
    *   **B:** The image is perfectly sharp, edge-to-edge. This is physically impossible and screams "CG".
    *   **Change:** Render through a physically-based camera. Add a small amount of depth of field (F-stop ~f/16 or higher). In post, add 1-2 pixels of chromatic aberration.
4.  **Layout & Typography:** B's composition is cluttered and less refined.
    *   **A:** The background is clean, focusing attention on the logos. The typography is well-set.
    *   **B:** The background UI elements are distracting noise that compete with the foreground. The grey bezels on the logo panels are at least 50% too thick, making them look clunky. The "Live Now" text is tracked too tightly.
    *   **Change:** Remove the background UI graphics entirely. Reduce the bezel thickness on the logo panels. Re-set the typography to match the reference's tracking and weight.

## 5. The single highest-impact fix for this second
Fix the lighting: replace the harsh, default CG lights and shadows with large area lights and global illumination to create the soft, photographic quality of the reference.

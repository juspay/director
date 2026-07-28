# Second 6 — frames 180..209

## 1. What actually animates in A this second
-   **Camera:** A slow, continuous pull-back and tilt-up. The motion is perfectly smooth and appears to be a **linear** continuation of a move from the previous second. It covers the entire duration (f180-209).
-   **Recurly Button Press:** The yellow button begins to depress at f195 and reaches its lowest point at f199. This is a 5-frame animation with a clear **ease-in**, starting slow and accelerating into the press.
-   **Button Flip/Reveal:** The flip is a single-frame transition between f199 and f200. The yellow "Recurly" button is replaced by the blue "Juspay" button, which is already partway through its upward travel at f200.
-   **Juspay Button Settle:** From f200 to f209 (and beyond), the new blue button rises back to the default height. The motion has a distinct **ease-out**, slowing to a stop.
-   **Light/Shadow Sweep:** A soft, dappled shadow pattern (a caustic or gobo effect) sweeps across the entire scene from top-left to bottom-right. It begins entering the frame around f187 and has fully crossed the central button by f208. This is a slow, **linear** movement that adds constant life to the static frames.
-   **Reflections:** The broad, soft highlight on the yellow button's surface travels subtly in sync with the light sweep from f187-f199.

## 2. What animates in B this second
-   **Camera:** A pull-back and tilt-up, roughly matching the direction of A. It appears to be a **linear** move.
-   **Button Transition:** The yellow button is static from f180-f199. At f200, it disappears entirely. The blue button appears at f207, already in its final position.

**ABSENT in B:**
-   The button press animation (f195-199).
-   The physical flip transition.
-   The button rebound/settle animation (f200-209).
-   The animated light/shadow sweep across the scene.
-   Any movement of reflections or highlights.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Button Transition:** A animates a physical, tactile press-and-flip (f195-f200), giving the object weight and purpose. B has no animation at all; the yellow button simply vanishes at f200 and a different blue button appears 7 frames later at f207. This is a jarring cut, not a transition.
    -   **FIX:** Animate the button depressing on its Z-axis from f195-f199 with an ease-in curve. Between f199-f200, execute a near-instantaneous 180-degree flip on its local X-axis while simultaneously swapping the texture/logo. From f200-f209, animate the button rising back to its original Z-position with an ease-out curve.
2.  **Environmental Motion:** A's scene is alive due to the constant, slow sweep of dappled light and shadow. B's scene is completely static and dead until the button disappears. This lack of secondary motion makes the world feel fake.
    -   **FIX:** Create a large, animated texture (like a fractal noise) to act as a gobo or light blocker for a key light. Animate this texture moving slowly and linearly across the scene for the entire duration of the shot to replicate the moving shadows.
3.  **Camera Framing:** A's camera is positioned further back and has a shallower angle, creating a more pleasing, flatter composition. B's camera is too close and angled too steeply, causing more dramatic perspective distortion and making the layout feel cramped.
    -   **FIX:** Pull the camera back by about 20% and reduce its X-axis rotation by about 10-15 degrees to better match the composition in A f180.

## 4. Design/render-craft differences (ranked)
1.  **Lighting & Shadows:** This is the primary reason B looks like a viewport render. A uses large, soft area lights and global illumination, creating extremely soft, diffuse shadows and realistic light bounce. The moving light adds complexity. B uses a single, hard light source, resulting in sharp, dark, unrealistic shadows and a flat, high-contrast look. There is no ambient occlusion or bounced light.
    -   **FIX:** Delete the current light. Add a large overhead area light (at least 5x the size of the scene) for soft global fill. Add a second, smaller animated light with a gobo for the shadow sweep. Enable Global Illumination and increase the number of light bounces to fill in the contact shadows realistically.
2.  **Material Definition:** A's materials have subtle imperfections and realistic roughness. The white base has a paper-like matte finish; the metal socket has a brushed, anisotropic texture (f199); the yellow button is a diffuse plastic with a soft sheen. B's materials are default shaders: pure white, basic grey metal, and 100% saturated yellow plastic.
    -   **FIX:** Add subtle noise maps to the roughness channels of all materials to break up reflections. Change the metal shader to anisotropic and map a linear texture to create the brushed look. Reduce the saturation of the yellow material by ~15% and increase its roughness.
3.  **Depth of Field & Post-FX:** A is rendered through a physical camera, with clear depth of field that softens the background and foreground elements (see the "Successrate" card in f180). It also has a subtle bloom on the highlights and a warmer overall color temperature. B has an infinite depth of field where everything is perfectly sharp, and the color is cold and clinical.
    -   **FIX:** Enable depth of field on the camera, focusing on the Recurly logo. Set the f-stop low enough to gently blur the background elements. In post, warm the image temperature, add a 2-3% bloom effect, and slightly lift the black levels.
4.  **Typography & Graphic Detail:** A's typography is more refined: "Successrate" (f180) uses a lighter font weight and is tracked out more loosely. The graph line below it is thin and has a slight wobble, as if hand-drawn. B's type is heavier and tighter, and the graph is a perfect, sterile vector line. This sterility applies to all graphic elements.
    -   **FIX:** Match the font weights and tracking from A precisely. Replace the perfect graph line with an SVG or texture that has the same hand-drawn imperfections as the reference.

## 5. The single highest-impact fix for this second
Overhaul the lighting completely to eliminate the harsh, static shadows and introduce the soft, animated, dappled light that gives the reference its photorealistic quality.

# Second 3 — frames 90..119

## 1. What actually animates in A this second
-   **Camera:** The camera executes a very slow, continuous drift up and to the right throughout this second. The movement is subtle, approximately 1-2% of the frame's height/width over 30 frames. The easing is perfectly **linear**, but it's overlaid with a microscopic, high-frequency noise or "float" that gives it an organic, handheld quality, preventing it from feeling robotic.
-   **Objects:** All objects (buttons, background panels) are static relative to each other.
-   **Icons:** All icons are static.
-   **Lights/Shadows:** The lighting is static. The shadows do not change shape or direction, but their position relative to the frame edges shifts due to the camera's movement, creating a subtle parallax effect that enhances the sense of depth.
-   **Reflections:** Static.

## 2. What animates in B this second
-   Nothing. The shot is a complete still. Every frame from f90 to f119 is identical.
-   **Absent from A:** The crucial, scene-defining camera drift and organic float are entirely absent.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Camera Liveliness:**
    -   A's camera is constantly in motion with a slow, linear drift and a subtle organic wobble. This makes the scene feel observed and physically present.
    -   B's camera is completely locked off, making the shot feel dead, sterile, and digital.
    -   **Fix:** Add a camera move. Animate its position from f0 to the end of the shot with linear keyframes to create a slow drift. Then, apply a subtle noise modifier or wiggle expression to the camera's position and rotation channels with a very low amplitude (e.g., < 0.1 units) and low frequency to simulate the organic float.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Shading:** This is the primary reason B looks like a viewport render.
    -   A uses soft, diffuse lighting, likely from a large area light or HDRI. This creates extremely soft shadows with realistic contact darkening where the buttons meet the surface. The light wraps around objects.
    -   B uses a harsh, direct light source. Shadows are sharp, uniform, and unnaturally dark, with no soft penumbra or contact detail. There is no evidence of global illumination or bounced light; surfaces in shadow are flat and lifeless.
    -   **Fix:** Replace your key light with a large area light, positioned to match A's highlights. Enable Global Illumination (GI) or use a light dome to simulate bounced light, lifting the shadows out of pure black and adding subtle color bleed. Increase shadow ray samples significantly.

2.  **Material Properties:**
    -   A's materials feel physical. The white base is a matte, paper-like surface with microscopic roughness that diffuses light softly. The blue on the icons is printed *on* this surface, sharing its material properties.
    -   B's materials are default shaders. The white is a perfect, textureless Lambertian surface. The blue is 100% emissive or unshaded, glowing with a pure primary color that feels disconnected from the scene's lighting.
    -   **Fix:** Add a subtle roughness map (a very low-contrast noise texture) to your white material's specular/roughness channel. The blue icon/text material should not be emissive; it should be a diffuse material that receives light and shadow just like the white surface it's on.

3.  **Color Palette and Grading:**
    -   A's palette is sophisticated. The "white" is a warm off-white. The blue is a desaturated, slightly purple-hued corporate blue. The overall color temperature is warm.
    -   B uses harsh, uncorrected digital primaries. The white is #FFFFFF, the blue is #0000FF. The result is cold, sterile, and cheap.
    -   **Fix:** Color-pick directly from the reference. The white should be around #F5F4F8. The blue is closer to #4A59D8. Apply a post-processing effect to warm the entire image's temperature by 300-500K.

4.  **Geometry and Bevels:**
    -   A's buttons have a soft, multi-segment bevel on their top edge that catches a soft highlight, giving them volume and a premium, molded feel.
    -   B's button edges are perfectly sharp, a tell-tale sign of basic 3D geometry. This makes them look thin and unsubstantial.
    -   **Fix:** Add a rounded bevel to the top edges of the buttons with at least 3-4 segments to ensure the highlight is smooth.

5.  **Typography and Iconography:**
    -   A's typography is set with care; the tracking on "Subscriptions" is tight and balanced. The icons are designed with consistent stroke weights and clean curves.
    -   B's typography is lazy; the tracking on "Subscriptions" is far too wide. The "Retries" icon is crudely constructed (a circle with a triangle punched out) instead of being a continuous, curved arrow shape.
    -   **Fix:** Match the font and weight. Manually adjust the tracking on "Subscriptions" to be roughly -25% of its current value. Redraw the icons in Illustrator to precisely match the reference shapes.

## 5. The single highest-impact fix for this second
Re-light the entire scene using a large area light and Global Illumination to create soft, physically-accurate shadows and bounced light.

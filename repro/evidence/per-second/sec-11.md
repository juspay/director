# Second 11 — frames 330..359

## 1. What actually animates in A this second
- **Camera:** Static. No movement, rotation, or zoom.
- **Objects:** The Recurly and Juspay logo cards are static.
- **"Live Now" button:** The blue outline and its glow execute a slow, soft pulse. The brightness increases from f330 to a peak around f345, then decreases towards f359. The easing is a continuous sine wave, part of a longer loop that likely spans 2-3 seconds.
- **Light Sweep:** A very subtle, large-scale light sweep moves across the entire scene. This is visible in the highlights on the top-left of the Recurly card and the shifting light patterns on the background panels. The movement is extremely slow, appearing almost linear over this 30-frame duration. It keeps the static scene feeling alive.
- **Shadows/Reflections:** As a consequence of the light sweep, reflections and highlights travel almost imperceptibly across all surfaces.

## 2. What animates in B this second
- Nothing. The image is completely static from f330 to f359.

- **Absent from A:**
  - The pulse animation on the "Live Now" button.
  - The large-scale, subtle light sweep.
  - All resulting secondary motion (travelling highlights, reflections).

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Living Still vs. Dead Freeze:** A's scene is a deliberate hold, kept alive by continuous, subtle micro-animations (the button pulse, the light sweep). This feels polished and intentional. B is a completely static frame; it feels like a mistake, an export error, or a lazy hold.
    -   **Fix:** The scene must never be truly static. Implement the button pulse using a looping expression on its emission/glow property. Create the light sweep by animating a very large, soft area light or the rotation of an HDRI over the entire shot duration.

## 4. Design/render-craft differences (ranked)
1.  **Lighting:** A uses a sophisticated lighting model with clear direction and color temperature variation. A warm key light comes from the top-left, and a cool, blue fill light comes from the bottom-right. This creates depth, shape, and visual interest. B uses flat, low-contrast, ambient illumination with no direction or color variation, which is why it looks like a raw viewport render.
    -   **Fix:** Re-light the scene from scratch. Use a large, warm area light as your key and a larger, dimmer, cool-colored area light for fill. This will immediately fix the flatness and introduce professional color contrast.

2.  **Material Definition:** A's materials feel physical. The background panels and card surrounds are a translucent, frosted material with soft specular highlights and subtle subsurface scattering. B's materials are opaque, default grey plastic. They absorb light instead of transmitting or reflecting it in a complex way.
    -   **Fix:** Add a subtle translucency or SSS (subsurface scattering) property to the non-logo materials. Use a GGX shader and increase the roughness to get wide, soft highlights, not the tight, cheap-looking ones currently present.

3.  **Shadows:** A's shadows are extremely soft, faint, and tinted by the cool fill light. They ground the objects without being distracting. B's shadows are too dark, have artificially sharp contact points, and are a dead, neutral grey. They look like default, fast-render shadows.
    -   **Fix:** Drastically increase the size of your light sources to soften the shadows. Reduce the shadow opacity/density to ~15-20%. Tint the shadow color with a bit of blue to integrate them into the scene.

4.  **Background Composition:** A's background is a clean, abstract geometric pattern that supports the foreground elements. B's background is cluttered with distracting, low-opacity UI charts and graphs that compete for attention and make the composition messy.
    -   **Fix:** Remove the UI chart textures from the background entirely. Model the simple, clean tile geometry from reference A.

5.  **Typography:** In A, the "Live Now" text is a lighter weight, sitting elegantly inside the button. In B, the text is too bold, making it feel clunky and heavy.
    -   **Fix:** Change the font weight of "Live Now" to a Regular or Light variant.

## 5. The single highest-impact fix for this second
Replace the flat, ambient lighting with a warm key and cool fill light system to create color contrast, depth, and believable soft shadows.

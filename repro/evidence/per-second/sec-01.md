# Second 1 — frames 30..59

## 1. What actually animates in A this second
-   **Camera:** A very slow, continuous drift. The camera is moving down and slightly right. The movement is constant throughout this second, implying it's part of a much longer move with very slow ease-in/ease-out curves. It is not static.
-   **"Renewal Success" Icon:** The blue circular progress bar animates, filling clockwise. It starts at roughly 75% full at f30 and completes its fill by f50. The animation takes ~20 frames and appears to have a slight ease-out as it completes.
-   **Light Sweep:** A broad, soft highlight travels across the entire scene from left to right. This is most visible on the main white tile under "Secure Payments" and as a specular highlight moving across the yellow tile at the bottom. This is a slow, linear movement across the full second.
-   **Shadows:** The contact shadows under the tiles subtly shift and change softness in response to the moving light source. This is a secondary animation driven by the light sweep.

## 2. What animates in B this second
-   **Camera:** The camera pans down and to the right. The motion appears perfectly linear, without any easing.
-   **"Renewal Success" Icon:** The blue circular progress bar animates. It starts at a similar position to A at f30 but completes its animation faster, by around f45. The easing is linear.
-   **Absent from B:** There are no light sweeps, no travelling reflections, and no corresponding shadow movement. The lighting is entirely static.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Static vs. Dynamic Lighting:** A's scene is brought to life by a key light that sweeps across the surfaces, creating moving highlights and reflections. B's lighting is completely static, which makes the scene feel dead and digital. **Change:** Animate a large, soft area light (or the environment HDRI) to move slowly across the scene throughout the shot to replicate the travelling highlights seen in A.
2.  **Camera Easing:** A's camera has an organic, subtle drift that feels physical and controlled. B's camera move is a perfectly linear, robotic pan. **Change:** Replace the linear keyframes on the camera with a gentle ease-in/ease-out curve that spans the entire shot, not just this second. The velocity within this one-second clip should be nearly constant, but it must not be perfectly linear.
3.  **Micro-animation Pacing:** A's "Renewal Success" icon animation is more deliberate, taking ~20 frames with a subtle ease-out. B's is faster (~15 frames) and linear, making it feel abrupt and less refined. **Change:** Retime the icon animation to last 20-25 frames and apply a standard ease-out curve.

## 4. Design/render-craft differences (ranked)
1.  **Lighting Quality:** A looks photographed because it uses soft, diffuse lighting with realistic global illumination. Note the gentle gradients across the white tiles and the extremely soft contact shadows. B looks like a viewport render because it uses a harsh, direct light source with poor GI, resulting in flat surfaces, sharp specular highlights on edges, and no convincing contact shadows. **Change:** Delete the current lights. Use a large area light as the key and a high-quality HDRI for ambient fill and reflections. Enable ray-traced global illumination and soft shadows.
2.  **Material Definition:** A's materials have texture. The white surfaces have a subtle, non-uniform matte finish; the yellow tile has a clear anisotropic/brushed texture (f50-f59). B's materials are perfect, uniform shaders, like default plastic. **Change:** Add subtle noise or grunge maps to the roughness channels of all materials to break up the perfect reflections. The yellow tile needs an anisotropic shader with a brushed metal texture map.
3.  **Depth of Field:** A has a shallow depth of field. The "Secure Payments" tile is in focus, while the "Renewal Success" tile and the yellow tile are slightly out of focus. This gives the shot a sense of scale and physicality. B is perfectly sharp from corner to corner, which is unnatural and flattens the image. **Change:** Enable depth of field on your render camera, set the focus distance to the "Secure Payments" tile, and use an f-stop value that produces a gentle, visible falloff.
4.  **Typography:** In A, the text "Secure Payments" is a lighter font weight and is positioned with more negative space around the icon. In B, the font is too bold and kerned too tightly, and it crowds the shield icon. **Change:** Reduce the font weight by one step (e.g., from Medium to Regular), increase tracking by ~5%, and move the text block slightly to the right to create better visual balance.

## 5. The single highest-impact fix for this second
Re-light the entire scene from scratch using a large, soft, moving area light and an HDRI to create the dynamic, diffuse lighting and soft contact shadows that give the reference its physical presence.

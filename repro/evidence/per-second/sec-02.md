# Second 2 — frames 60..89

## 1. What actually animates in A this second
-   **f60-f65:** The shot is completely static. The camera and all objects are held in a settled state from a previous move.
-   **f65 to f66:** A hard cut to a new scene. There is no transition or motion blur.
-   **f66-f89:** A new camera move begins.
    -   **Camera:** The camera is dollying backwards and tracking right simultaneously. It is in the middle of a longer move, decelerating into a final position. The easing is a clear **ease-out**, visible by the decreasing distance travelled by background elements frame-over-frame (e.g., the yellow bar at the top moves less between f88-f89 than it does between f68-f69).
    -   **Reflections:** As the camera moves from f66 to f89, a broad, soft highlight travels across the main white surfaces from top-left to bottom-right. This indicates the light sources are fixed in world space, not parented to the camera. The highlight on the top bevel of the "Subscriptions" button also travels along its length.
    -   **Shadows:** The soft shadows cast by the UI elements shift their angle and length slightly in response to the camera move, consistent with a fixed light source.

## 2. What animates in B this second
-   **Camera:** A single, continuous camera move runs from f60 to f89. It dollies out and tracks right. The speed is constant; the easing is **linear**. There is no initial hold and no final ease-out visible within this second.
-   **Reflections:** Entirely ABSENT. The lighting on the surfaces is static relative to the camera.
-   **Shadows:** Entirely ABSENT. There is no perceptible shadow animation.
-   **The hard cut at f66:** Entirely ABSENT.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Pacing and Rhythm:** A uses a static hold followed by a hard cut to a new, gracefully easing shot. This creates a deliberate rhythm of "statement, cut, new statement." B uses a single, continuous, linear move that feels mechanical, lacks intention, and has no rhythm.
    -   **Change:** Re-animate the camera. Make f60-f65 a static hold. At f66, cut to the new framing. Animate the camera for the f66-f89 shot with a pronounced ease-out curve, so it's clearly decelerating.
2.  **Illusion of a Real Space:** In A, the reflections and shadows move in parallax to the camera, selling the illusion of a physical object in a lit environment. In B, the lighting is "stuck" to the objects, as if the lights are parented to the camera or the materials are emissive. This completely breaks the physical illusion.
    -   **Change:** Light the scene with stationary lights. Do not parent them to the camera. As the camera moves, the highlights and shadows must shift across the surfaces.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Shading:** A looks photographed. It uses soft, directional key lighting that creates subtle gradients across every surface. Shadows are extremely soft and diffuse, but there are clear, dark contact shadows where objects meet the ground plane (see under the buttons, f75). B looks like a raw viewport render. The lighting is flat, omnidirectional, and high-key, blowing out all surface detail. There are no shadows, no gradients, and no sense of form.
2.  **Materiality:** A's materials have texture and specular response. The white surface has a subtle grain. The panel on the far right (f78) has a clear brushed-metal texture. The button bevels catch a soft, broad specular highlight. B's materials are pure, diffuse shaders. The white is 100% white, the blue is a fully saturated primary. There is no surface texture or specular response.
3.  **Depth and Focus:** A uses a shallow depth of field. In f60, the "Renewal Success" button is softer than the "Secure Payments" button. In f75, the background elements are slightly out of focus. This directs the eye and adds photographic realism. B has an infinite depth of field; every object is perfectly and unnaturally sharp.
4.  **Typography and Iconography:** A's typography is heavier, better tracked, and sits more naturally on the button. B's type is too thin, the tracking on "APMs" is too wide, and the colour is too vibrant. The icons in B are crude approximations; compare the "Retries" icon in A f75 to B f75—A's is a refined shape, B's is a primitive circle and triangle.

## 5. The single highest-impact fix for this second
Re-light the scene from scratch with a single, large area light to create soft, directional shadows and add a camera with depth of field enabled.

# Second 4 — frames 120..149

## 1. What actually animates in A this second
-   **Camera (f120-f146):** A slow, continuous, and perfectly linear camera move. It is a combination of a dolly (moving down and slightly right) and a subtle orbit/rotation around the UI elements. The perspective on the buttons shifts slightly, indicating the camera is not just panning but moving in 3D space. There is also a micro-layer of high-frequency noise, a very subtle handheld float, that prevents the move from feeling robotic.
-   **Light/Shadows (f120-f146):** A soft, dappled shadow pattern sweeps across the entire scene, moving from top-left to bottom-right. This movement is independent of the camera move. The shapes of the shadows morph slightly as they travel, suggesting an off-screen light source with something like leaves or clouds moving in front of it. The easing is linear.
-   **Reflections (f120-f146):** As the camera moves, subtle specular highlights travel across the rounded top edges of the three white buttons.
-   **Objects/Icons:** All UI elements, icons, and text are completely static during this shot.
-   **Cut (f146-f147):** There is a hard cut to a new, static shot at f147.

## 2. What animates in B this second
-   **Camera (f120-f146):** A slow, linear camera dolly, moving almost purely downwards in screen space. There is no orbital component, no perspective shift, and no handheld float.
-   **Cut (f146-f147):** There is a hard cut to a new shot which appears to be a placeholder.

-   **ABSENT in B:**
    -   The animated, dappled light/shadow sweep.
    -   The subtle orbital camera rotation.
    -   The handheld camera noise/float.
    -   Travelling specular reflections on button edges.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Animated Lighting:** A's scene feels alive because the dappled light moves independently of the camera, creating a sense of a real-world environment. B's lighting is completely static, locked to the objects, which makes the scene feel sterile and dead.
    -   **Change:** Animate a light source (or a texture/gobo projected from a light) to move across the scene from f120-f146, mimicking the shadow sweep in A.
2.  **Camera Polish:** A's camera has a subtle, organic float that breaks up the mechanical perfection of a CG camera. B's camera is a perfect, robotic dolly.
    -   **Change:** Add a very small amount of noise (e.g., a wiggle expression) to the camera's position and rotation channels to simulate a handheld feel. The magnitude should be tiny, just enough to break the perfect CG line.
3.  **Camera Path:** A's camera combines a dolly and an orbit, creating more parallax and visual interest. B's is a simple, one-axis dolly that feels flat.
    -   **Change:** Add a rotational value to the camera's animation path so that the viewing angle changes from f120 to f146, matching the perspective shift in A.

## 4. Design/render-craft differences (ranked)
1.  **Lighting & Shadows:** This is the primary reason A looks photographed and B looks like a viewport render. A uses large, soft light sources to create extremely diffuse, soft-edged shadows and subtle gradients across surfaces. The dappled light effect adds complexity and realism. B uses flat, ambient lighting with no discernible key light or shadow casting, resulting in a complete lack of depth and form.
    -   **Change:** Re-light the scene from scratch. Use a large area light as a key to create soft shadows. Use global illumination or a fill light to provide bounce and lift the shadows so they aren't pure black.
2.  **Materials & Shading:** A's materials have realistic surface properties. The white base has a matte, paper-like roughness. The buttons have a slightly lower roughness, allowing for soft specular highlights. B's materials are basic, 100% diffuse shaders with no specular or roughness response.
    -   **Change:** Implement a PBR material workflow. Give the base panel a high roughness value (e.g., 0.8) and the buttons a slightly lower one (e.g., 0.6). Add a very subtle surface imperfection/noise map to the roughness channels.
3.  **Geometry & Bevels:** A's buttons have a soft, generous fillet on their edges that catches the light realistically. B's buttons have a simple, sharp chamfer that looks cheap and low-poly.
    -   **Change:** Increase the radius and segment count of the bevels on all buttons to create a softer, more premium edge highlight.
4.  **Typography & Color:** In A, the typography is a lighter weight, the tracking is looser, and the blue is a slightly desaturated, sophisticated shade. In B, the font is too bold, the tracking is too tight (see "Subscriptions"), and the blue is a fully saturated primary color that looks like a default shader.
    -   **Change:** Switch to a lighter font weight. Increase character tracking by 10-15%. Desaturate the blue color by at least 20% and give it a slightly darker value.

## 5. The single highest-impact fix for this second
Re-light the scene using soft area lights and animate a projected texture to create the moving, dappled shadows that give the reference its life and photographic quality.

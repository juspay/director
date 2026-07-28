# Second 14 — frames 420..434

## 1. What actually animates in A this second
Nothing animates. This is a static hold from f420 to f434. The composition is held to allow the information to be read.

## 2. What animates in B this second
Nothing animates. This is also a static hold. No animation from A is absent.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Appropriateness of the Static Hold:** A's composition is clean, balanced, and minimal, making a static hold feel like a deliberate, confident pause. B's composition is cluttered and unbalanced, so a complete lack of motion makes it feel dead, broken, or unfinished—like an animator forgot to add a camera drift.
    *   **A does:** Uses a static shot on a resolved, calm composition.
    *   **B does:** Uses a static shot on a busy, unresolved composition.
    *   **Change needed:** B needs to introduce a micro-movement to keep the busy frame alive. Add a very slow camera push, scaling the frame by ~1-2% over these 15 frames with an ease-out curve, to prevent the shot from feeling static and dead.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Shadow:** This is the primary reason B looks like a viewport render.
    *   **A:** Lit with large, soft, diffuse sources. This creates subtle, soft gradients across the background and wraps light around the objects. Shadows are extremely soft and diffuse, with visible contact occlusion where the cards meet the wall, grounding them in the scene. The lighting feels photographic.
    *   **B:** Lit with flat, directionless ambient light. The shadows are hard-edged, uniform grey shapes that look like a 2D "drop shadow" layer style, completely disconnected from the objects casting them. There are no contact shadows, making the elements look like they are floating arbitrarily.
    *   **Change needed:** Delete the current lighting setup. Use large area lights to replicate the soft falloff. Enable ray-traced soft shadows and ambient occlusion to create realistic contact shadows and depth.

2.  **Materiality and Texture:**
    *   **A:** The background has a subtle, non-uniform texture, like a painted wall or high-quality paper stock. The logo cards have a clean, matte finish. The "Live Now" button appears to be a frosted, slightly translucent material.
    *   **B:** The background is a chaotic stack of flat, textureless planes. The logo cards are encased in a thick, grey, plasticky frame with no defined material properties. Everything has a default, undifferentiated CG shader.
    *   **Change needed:** Replace the cluttered background with a single plane. Apply a subtle noise or grunge map to the roughness or bump channel of the background material to break up the perfect CG surface. The grey frames need a defined material—either a brushed metal or a matte plastic—with corresponding roughness values.

3.  **Composition and Depth:**
    *   **A:** The composition is a simple, centered, and balanced grid. There is ample negative space. The sense of depth is shallow and believable, achieved through lighting and shadow softness.
    *   **B:** The composition is a chaotic mess. The background UI elements are distracting and compete for attention with the foreground logos. The tilted angles of the logo cards feel random and unmotivated, not deliberate.
    *   **Change needed:** Delete the background UI elements. If they must remain, push them far back in Z-depth, reduce their opacity to <15%, and apply a heavy depth-of-field blur so they become a textural element, not a competing one. Straighten the logo cards to match A's direct, head-on presentation.

4.  **Typography and Graphic Design:**
    *   **A:** The "Live Now" text is a lighter font weight, perfectly centered in the button. The logo typography is crisp and correctly proportioned.
    *   **B:** The "Live Now" text is too bold, too large for the button, and its tracking is too tight. The "Recurly" logo appears slightly stretched horizontally. The grey bezels around the logo cards are excessively thick and clumsy.
    *   **Change needed:** Reduce the font weight and size of "Live Now" by ~20% and center it. Correct the aspect ratio of the logo assets. Reduce the thickness of the grey bezels by at least 50%.

## 5. The single highest-impact fix for this second
Re-light the scene from scratch using large area lights and ray-traced soft shadows to make the objects feel integrated and physically present.

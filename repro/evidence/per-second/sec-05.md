# Second 5 — frames 150..179

## 1. What actually animates in A this second
- **Camera:** A slow, continuous camera move is in progress. It's a combination of a dolly-in and an orbit to the right. The motion appears to be `linear` within this one-second segment, likely part of a longer ease-in/ease-out curve.
- **Light/Shadows:** The dappled light and shadows are actively, albeit slowly, animating. The leaf-like shadow on the yellow "Recurly" button and the surrounding white tiles subtly shifts its shape and position from f150 to f179. This is independent of the camera move and suggests an animated light source or gobo, creating an organic, environmental feel. The easing is a slow, continuous `linear` drift.
- **Reflections:** Subtle specular reflections on the brushed metal socket holding the yellow key travel across the surface, consistent with the animated light source.

## 2. What animates in B this second
- **Camera:** A camera move is present, trucking left and dollying back. It reveals more of the scene on the right over the course of the second. The speed feels `linear` and slightly faster than in A.
- **"Recurly" Logo:** The logo appears instantly on the yellow button between f153 and f154. This is a one-frame `pop-on`.
- **"Secure Payments" Tile:** This tile slides in from the left, starting around f156 and settling around f165. This is an independent object animation.
- **ABSENT in B:** The core element of life from A is missing: the animated, dappled light and shadows. The lighting is completely static. The subtle logo reveal is also absent, replaced by a hard cut.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Logo Reveal vs. Pop-on:** A's logo is present from f150, implying it animated on earlier. B's logo `pops` into existence on f154. This is jarring and amateurish. B needs to replace the pop-on with a 5-10 frame fade or scale-up animation that settles before this second begins.
2.  **Environmental Animation:** A's scene feels alive because of the constantly shifting dappled light. B's scene is static and dead because the lighting is fixed. B needs to introduce a slow, looping animated texture (like a soft noise or a blurred leaf pattern) into its key light's gobo/projector slot to simulate this effect.
3.  **Camera Path and Speed:** A's camera move is a graceful, slow push-in that enhances focus on the central button. B's camera move is a faster lateral truck-out that feels less deliberate and reveals background elements too quickly. B needs to slow its camera move by ~25% and change the trajectory to be more of a dolly-in/orbit, matching A's framing at f150 and f179.
4.  **Extraneous Animation:** B animates the "Secure Payments" tile sliding in. In A, this tile is static throughout the second. This secondary animation in B distracts from the focal point. B needs to remove this animation; the tile should already be in its final position at f150.

## 4. Design/render-craft differences (ranked)
1.  **Lighting and Shadows:** This is the primary reason B looks like a viewport render. A uses soft, complex lighting, likely an HDRI for fill and a large area light for a key, creating very soft, diffuse shadows with realistic penumbras. B uses a single, hard light source, creating sharp, unrealistic, and perfectly uniform shadows. The lack of ambient occlusion or bounce light in B makes contact points look fake.
2.  **Materiality:** A's materials have texture and subtle imperfections. The white surfaces have a matte, almost paper-like finish; the yellow button is a soft-touch plastic; the grey socket is brushed metal with anisotropic reflections. B's materials are flat shaders. The white is a basic 80% diffuse grey, the yellow is a simple plastic, and the grey socket is a uniform metallic with no surface detail. B needs to add subtle roughness and bump maps to all surfaces.
3.  **Depth of Field:** A uses a shallow depth of field, keeping the "Recurly" button sharp while the background ("Success rate") and foreground elements are soft, directing the viewer's eye. B has an infinite depth of field where everything is equally sharp, which flattens the image and removes the photographic quality.
4.  **Typography and Graphic Design:** In A, the typography is delicate and well-integrated. In B, the "Recurly" logotype is thicker and heavier than the reference. The "Secure Payments" text is a darker grey and tracked more tightly, making it harder to read and visually heavier than in A. The checkmark icon in B is a simple shape-layer check, whereas in A it has a subtle volume and shading.

## 5. The single highest-impact fix for this second
Replace the single, hard light source with a large area light and an HDRI to create soft, naturalistic shadows, which will immediately fix the "viewport render" look.

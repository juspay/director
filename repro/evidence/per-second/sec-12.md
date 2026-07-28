# Second 12 — frames 360..389

## 1. What actually animates in A this second
- **Camera:** Static.
- **Objects:** All objects (Recurly card, Juspay card, "Live Now" button) are static in position, scale, and rotation.
- **Lights:** The primary animation is a very slow, large-scale light sweep. A warm, yellow-toned light moves from the top-left towards the bottom-right, while a cool, blue-toned light moves from the bottom-right towards the top-left. This is visible as a gradual change in the background colour gradient across all 30 frames. The easing is perfectly `linear` within this one-second segment.
- **Reflections:** As a result of the light sweep, soft, diffuse specular highlights travel across the surfaces of the yellow Recurly card, the blue Juspay card, and the white "Live Now" button. This movement is subtle but continuous from f360 to f389.
- **Shadows:** The extremely soft shadows cast by the cards and button onto the background subtly shift in colour and direction, driven by the moving lights. For example, the shadow under the Recurly card at f360 is cooler than at f389, where it has been warmed by the passing yellow light.

## 2. What animates in B this second
- Nothing. The shot is a completely static hold. Every frame from f360 to f389 is identical.
- **Absent from B:** The primary light sweep, all travelling reflections, and all subtle shadow animation. The entire scene is lifeless.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Core Environmental Motion:** A's scene is made dynamic by a slow, constant `linear` sweep of large, soft, coloured lights. This is the only significant animation in the shot and gives it a sense of calm, continuous progression. B has zero animation; it is a still frame. B needs to implement this environmental light animation, likely by animating the rotation of a textured HDRI or moving large, soft area lights across the scene. The movement should be slow and consistent for the entire duration of the film, not just this second.
2.  **Responsive Reflections:** In A, the material properties of the cards are sold by the soft highlights that travel across their surfaces, proving they exist in a lit 3D space. B's highlights are static and baked-in, making the objects look flat and fake. B needs to ensure the card materials have appropriate specular and roughness values to catch the new animated lights, which will fix this issue automatically if the lighting (#1) is implemented correctly.

## 4. Design/render-craft differences (ranked)
1.  **Lighting Quality:** A looks photographed. It uses large, soft, diffuse light sources that create subtle, beautiful colour gradients and wrap around objects. Shadows are extremely soft, have realistic contact occlusion, and are coloured by the ambient light. B looks like a raw viewport render. The lighting is flat, low-contrast, and ambient. Shadows are just dark, uniform drop-shadows with no softness gradient or colour. The entire scene in B lacks a key light, directionality, and depth.
2.  **Background Design:** A's background is a clean, abstract surface with subtle grid lines and soft colour gradients that support the foreground elements. B's background is a cluttered, low-contrast mess of out-of-focus UI elements that compete with and distract from the main logo cards. The background in B must be completely replaced with the simple, elegant surface from A.
3.  **Material & Model Fidelity:** In A, the logo cards sit inside subtle, clear acrylic trays. In B, this has been misinterpreted as a thick, dark, clunky bezel that is part of the card itself, making it look cheap. The card colours in B are desaturated and muddy compared to the vibrant, clean colours in A. The models and materials for the cards and their holders must be rebuilt from scratch to match A's inset acrylic design.
4.  **Typography:** The typography in B is poorly executed. The "Recurly" logotype is too bold. The "Juspay hyperswitch" lockup is incorrectly arranged on a single line, making it look cramped, whereas A uses a balanced two-line lockup. Font weights and tracking are off across the board.

## 5. The single highest-impact fix for this second
Re-light the scene from scratch with large, soft, coloured area lights to create the reference's subtle gradients and ultra-soft shadows, then animate those lights in a slow, linear sweep.

# Second 8 — frames 240..269

## 1. What actually animates in A this second
-   **Camera:** The camera holds from f240-f242. From f243 to f269, it executes a continuous, combined dolly-out and clockwise rotation. The move starts relatively fast and is in the beginning of a long ease-out curve that continues past this second.
-   **"Live Now" button:** This object animates on from f261-f266. It's a combination of a scale-up from ~80% to 100% and a fade-in (opacity from 0% to 100%). The animation has a fast ease-out, settling into its final state by f266.
-   **Shadows:** Soft, dappled shadows (as if from a light through foliage or a gobo) drift across the entire scene from top-right to bottom-left throughout the second. This is visible on the "Subscriptions" button and the blank space above it between f248 and f258.
-   **Reflections:** As the camera moves, specular highlights travel across the bevelled edges of all buttons. This is most noticeable on the top edge of the "Recurly" button from f250-f260.

## 2. What animates in B this second
-   **Camera:** The camera is static from f240-f242. At f243, it performs an instantaneous jump-cut to a wider, rotated view. It then remains completely static from f243-f269.
-   **"Live Now" button:** The button appears instantly on f261. It is a one-frame pop-on with no scaling, fading, or easing.
-   **"Recurly" / "hyperswitch" buttons:** These also pop on at f249 and f252 respectively.
-   **ABSENT from B:**
    -   The continuous, eased camera move.
    -   The animated, drifting shadows.
    -   The travelling specular highlights.
    -   The eased, multi-frame appearance of the "Live Now" button.

## 3. Motion-craft differences (ranked, most damaging first)
1.  **Camera Transition:** A executes a smooth, cinematic dolly-and-rotate move starting at f243, creating a seamless transition. B uses a jarring jump-cut at f243, which completely breaks the flow and feels like a technical error. **Fix:** Replace the cut at f243 with a continuous camera move. Keyframe the camera at f242 and a later point (e.g., f280) to match A's start and end positions, then apply an ease-out curve to the entire move.
2.  **Element Reveals:** A's "Live Now" button appears with a soft, 5-frame scale/fade-in (f261-f266), making it feel integrated. B's button, along with the Recurly and hyperswitch logos, pops on in a single frame. This is abrupt and cheap. **Fix:** Animate the scale and opacity of the "Live Now" button from 0 to 100% between f261 and f266 using an ease-out curve. Do the same for the other logo reveals.
3.  **Environmental Motion:** A's scene feels alive due to the constantly shifting dappled light and shadows. B's scene is static and dead, with no motion other than the primary cuts and pops. **Fix:** Animate a gobo or a noise texture in your key light's projection to create a slow, subtle drift of light and shadow across all surfaces throughout the entire shot.

## 4. Design/render-craft differences (ranked)
1.  **Lighting & Shading:** A looks photographed. It uses soft, directional area lights that create gentle gradients across surfaces, soft contact shadows, and specular highlights on edges. The materials have subtle surface imperfections and roughness variation. B looks like a viewport render. The lighting is flat, overly bright, and non-directional, washing out all detail. Materials are basic diffuse shaders with no specular response. **Fix:** Delete the current lighting. Add a large area light as a key to create soft shadows. Add a subtle texture map to the roughness channel of all materials to break up reflections. Reduce ambient light significantly.
2.  **Geometry & Material Detail:** In A, the buttons have soft, multi-step bevels that catch the light realistically. The base plate under the "hyperswitch" button has a convincing brushed-metal texture (f240). In B, buttons have a uniform, harsh fillet. The base plate is a flat grey solid. **Fix:** Remodel the button edges with a multi-step chamfer/bevel. The base plate needs a brushed metal shader with an anisotropic reflection model and a corresponding texture map.
3.  **Typography & Graphics:** A's typography is a lighter weight and is kerned properly. It feels printed on the surface. B's "hyperswitch" text is too bold and the tracking is too tight, making it hard to read (f240). The "Live Now" text is a heavy, stark sans-serif that looks like a default font (f262). **Fix:** Reduce the font weight on all labels. Increase tracking on "hyperswitch" by 5-10%. Choose a more refined, lighter-weight font for the "Live Now" button.

## 5. The single highest-impact fix for this second
Replace the jump-cut at f243 with a smooth, eased camera move that matches the reference's path and timing.

# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Recreate the 3D keyboard key geometry and layout to match the reference, ensuring proper key bevels and spacing.

## Verified / surviving claims
### [sev 2] camera @ t=1.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera has a lower perspective angle, showing the vertical depth of the tiles.
- **B:** The camera has a higher, more top-down angle, reducing the visible depth of the tiles.
- **Fix (advisory):** Lower the camera angle to match the perspective of the reference.
- **Channel B (Gemini):** supported — Clip A shows the tiles from a lower, more oblique angle, which highlights their 3D thickness and vertical depth. Clip B is shot from a higher, more top-down perspective, making the tiles appear flatter and reducing their visible depth.
- **Channel A (Claude):** supported — The observable is real: A's cards and wall show more visible vertical depth/thickness; B reads slightly steeper and its wall steps barely register. Actionable nuance: the fix is step heights and card-side presence more than camera angle — B's elevation is at most a few degrees hot.

### [sev 2] lighting @ t=1.50s — 2/3 runs — **MEASURED ✓**
- **A:** The scene has high contrast with bright highlights on the key surfaces and deep shadows in the crevices between keys.
- **B:** The scene is flatly lit with low contrast, grey shadows, and no distinct highlights on the key surfaces.
- **Fix (advisory):** Adjust the lighting setup to increase contrast, adding a stronger directional light source to create defined highlights and deeper shadows.
- **Measurement:** {"p01":57.25,"p1":83.76,"p5":96.27,"p50":203.89,"p95":245.37,"p99":249.44,"p999":251.78,"span_p5_p95":149.1} vs {"p01":95.8,"p1":110.02,"p5":139.73,"p50":208.5,"p95":226.52,"p99":228.24,"p999":250.86,"span_p5_p95":86.79}

## Killed in verification
### [sev 3] lighting @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene has a warm, golden-yellow color cast from the lighting.
- **B:** The scene has a flat, neutral grey/white color cast.
- **Fix (advisory):** Add a warm-colored light source to replicate the golden color cast of the reference.
- **Measurement:** {"r":190.28,"g":199.88,"b":202.67,"rb_delta":-12.39,"saturation":0.201} vs {"r":199.39,"g":204.03,"b":213.54,"rb_delta":-14.15,"saturation":0.0706}

### [sev 3] layout @ t=1.50s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The 'Secure Payments' tile is surrounded by distinct 3D keyboard-like keys with clear gaps and bevels, including a bright blue key on the left and a yellow key at the bottom.
- **B:** The 'Secure Payments' tile sits on a flat surface with thin grey lines representing key boundaries, lacking the 3D depth, bevels, and the same arrangement of colored keys.
- **Fix (advisory):** Recreate the 3D keyboard key geometry and layout to match the reference, ensuring proper key bevels and spacing.
- **Channel B (Gemini):** supported — The visual differences described in the claim are accurate. Clip A shows distinct 3D keys with bevels, a blue key on the left, and a yellow key at the bottom. Clip B shows a much flatter surface with thin grey lines representing key boundaries, lacking the 3D depth and bevels of Clip A, and has a different arrangement of colored keys.
- **Channel A (Claude):** refuted — B's 'Secure Payments' and 'Renewal Success' ARE distinct chunky 3D keys with visible side faces — the claimed flat-vs-3D contrast for the subject keys is contradicted. Honest residual folded into 01:0: the WALL steps read shallower than A's.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

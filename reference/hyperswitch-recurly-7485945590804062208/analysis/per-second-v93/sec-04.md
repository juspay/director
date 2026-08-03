# Second 4 — original frames 120-149

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the lighting color temperature and block material properties to match the cool blue cast and glossy specular highlights of the reference.

## Verified / surviving claims
### [sev 3] material @ t=4.50s — 1/1 runs — **MEASURED ✓**
- **A:** The blocks exhibit a glossy finish with subtle specular highlights along their rounded edges.
- **B:** The blocks are matte with flat shading and no specular highlights on the edges.
- **Fix (advisory):** Increase the specularity and lower the roughness of the block material to catch highlights.
- **Measurement:** {"p01":64.21,"p1":76.5,"p5":133.38,"p50":208.3,"p95":245.71,"p99":249.14,"p999":251.01,"span_p5_p95":112.33} vs {"p01":79.94,"p1":101.9,"p5":120.41,"p50":201.81,"p95":218.26,"p99":223.18,"p999":253.86,"span_p5_p95":97.85}

### [sev 2] camera @ t=4.60s — 1/1 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned at a dynamic perspective angle relative to the three vertical blocks.
- **B:** The camera angle is flatter and more front-on, reducing the perspective depth.
- **Fix (advisory):** Adjust the camera focal length and position to match the perspective angle of the reference.
- **Channel B (Gemini):** supported — Clip A shows the camera positioned at a dynamic perspective angle relative to the three vertical blocks, while Clip B shows a flatter, more front-on camera angle that reduces the perspective depth.
- **Channel A (Claude):** supported — True, and it is the known trade: shot-2 azimuth was compressed to 0.45 sweep for type legibility, which flattened the column shot's perspective relative to A's more dynamic angle.

## Killed in verification
### [sev 2] color @ t=4.20s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The white blocks have a distinct cool blue color cast under the studio lighting.
- **B:** The white blocks are neutral grey with no blue color cast.
- **Fix (advisory):** Add a cool blue light source or adjust the white balance to introduce a blue color cast to the scene.
- **Measurement:** {"r":191.1,"g":203.02,"b":212.64,"rb_delta":-21.55,"saturation":0.1231} vs {"r":186.89,"g":196.99,"b":222.24,"rb_delta":-35.35,"saturation":0.1576}

### [sev 2] color @ t=4.95s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The Recurly block has a warm, golden-yellow hue.
- **B:** The Recurly block has a cooler, greenish-yellow hue.
- **Fix (advisory):** Adjust the diffuse color of the Recurly block to match the golden-yellow hue of the reference.
- **Measurement:** {"r":197.85,"g":204.38,"b":188,"rb_delta":9.85,"saturation":0.2148} vs {"r":189.03,"g":191.12,"b":178.49,"rb_delta":10.53,"saturation":0.28}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

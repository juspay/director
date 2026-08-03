# Second 5 — original frames 150-179

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera angle and perspective to match the oblique view of the reference, and soften the dark, harsh shadows in the button recesses.

## Verified / surviving claims
### [sev 4] camera @ t=5.20s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is positioned at a low, oblique angle relative to the keyboard grid, creating a strong perspective effect.
- **B:** The camera is positioned at a higher, more top-down angle, resulting in a flatter perspective.
- **Fix (advisory):** Adjust the camera pitch and height to match the oblique perspective of the reference.
- **Channel B (Gemini):** supported — Clip A shows a highly oblique, low-angle perspective of the keyboard grid, whereas Clip B is filmed from a higher, more top-down angle, resulting in a flatter perspective.
- **Channel A (Claude):** supported — A shoots the Recurly beat low and oblique (~45-50deg) with heavy perspective; B is near-top-down. The pass-8 elevation raise overshot for shot 3 — third corroboration of elevation-runs-hot.

### [sev 4] staging @ t=5.00s — 2/3 runs — **MEASURED ✓**
- **A:** The recess/well around the yellow 'Recurly' card has a soft, light-grey inner shadow.
- **B:** The recess/well around the yellow 'Recurly' card has a very dark, harsh black border.
- **Fix (advisory):** Soften and lighten the inner shadow of the button recesses.
- **Measurement:** {"p01":40.34,"p1":84.72,"p5":132.16,"p50":205.37,"p95":246.42,"p99":247.72,"p999":249.72,"span_p5_p95":114.26} vs {"p01":30.4,"p1":49.68,"p5":55.96,"p50":195.89,"p95":210.83,"p99":216.26,"p999":217.9,"span_p5_p95":154.87}

### [sev 3] material @ t=5.40s — 2/3 runs — **MEASURED ✓**
- **A:** The yellow 'Recurly' button has a glossy surface with visible specular highlights reflecting the light source.
- **B:** The yellow 'Recurly' button has a matte finish with diffuse reflection and no distinct specular highlights.
- **Fix (advisory):** Increase the specular glossiness and reduce roughness of the yellow button material.
- **Measurement:** {"p01":47.77,"p1":73.79,"p5":101.46,"p50":203.11,"p95":246.13,"p99":247,"p999":248.29,"span_p5_p95":144.67} vs {"p01":24.35,"p1":50.61,"p5":56.11,"p50":194.31,"p95":211.26,"p99":215.4,"p999":217.26,"span_p5_p95":155.15}

## Killed in verification
### [sev 3] lighting @ t=5.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center, showing a distinct vignette effect.
- **B:** The lighting is more uniform across the frame with less corner falloff.
- **Fix (advisory):** Add a vignette effect to darken the corners of the frame.
- **Measurement:** {"corner_mean":195.6,"center_mean":168.41,"falloff_pct":-16.14} vs {"corner_mean":193.32,"center_mean":172.26,"falloff_pct":-12.23}

### [sev 3] color @ t=5.80s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The white keys have a soft, cool blue-green color cast, especially in the shadowed areas.
- **B:** The white keys are neutral white/grey with no cool color cast.
- **Fix (advisory):** Adjust the white balance or add a cool color grade to match the reference's blue-green cast.
- **Measurement:** {"r":194.76,"g":199.14,"b":179.84,"rb_delta":14.92,"saturation":0.2054} vs {"r":176.79,"g":179.71,"b":169.01,"rb_delta":7.77,"saturation":0.3086}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

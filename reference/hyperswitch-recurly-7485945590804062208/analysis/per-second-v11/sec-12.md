# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the yellow button color to be warmer and more saturated, reduce the shadow density in the crevices, and lower the roughness of the button materials to introduce subtle gloss.

## Verified / surviving claims
### [sev 2] lighting @ t=12.50s — 2/3 runs — **MEASURED ✓**
- **A:** Crevices between the white tiles have soft, light gray shadows.
- **B:** Crevices between the white tiles have harsh, dark black shadows.
- **Fix (advisory):** Reduce the shadow density or ambient occlusion in the tile crevices.
- **Measurement:** {"p01":4.04,"p1":86.3,"p5":91.09,"p50":208.88,"p95":231.19,"p99":236.33,"p999":252.45,"span_p5_p95":140.1} vs {"p01":73.68,"p1":75.18,"p5":80.24,"p50":169.07,"p95":183.05,"p99":190.88,"p999":239.64,"span_p5_p95":102.81}

## Killed in verification
### [sev 2] material @ t=12.30s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** Buttons have a semi-glossy finish with soft environmental reflections.
- **B:** Buttons have a flat, matte finish with no specular reflections.
- **Fix (advisory):** Lower the roughness of the button materials to introduce subtle gloss.
- **Channel B:** The claim swaps the descriptions of the two clips. Clip A shows flat, matte buttons with no specular reflections, while Clip B shows 3D buttons with metallic, reflective borders and specular highlights.

### [sev 2] color @ t=12.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The yellow button has a warm, saturated golden-yellow color.
- **B:** The yellow button has a cooler, less saturated lemon-yellow color.
- **Fix (advisory):** Adjust the diffuse color of the yellow button to be warmer and more saturated.
- **Measurement:** {"r":193.83,"g":203.95,"b":200.08,"rb_delta":-6.25,"saturation":0.1893} vs {"r":139.6,"g":152.79,"b":189.32,"rb_delta":-49.72,"saturation":0.3128}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

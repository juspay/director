# Second 13 — original frames 390-419

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Add a vignette and deepen the shadows to match the high-contrast, moody lighting of the reference video.

## Verified / surviving claims
### [sev 2] color @ t=13.50s — 1/1 runs — **MEASURED ✓**
- **A:** Warm golden hue on the yellow button.
- **B:** Cooler, greenish-yellow hue on the yellow button.
- **Fix (advisory):** Adjust the yellow material color to be warmer.
- **Measurement:** {"r":194.53,"g":204.41,"b":200.72,"rb_delta":-6.2,"saturation":0.1862} vs {"r":140.31,"g":153.51,"b":190.13,"rb_delta":-49.82,"saturation":0.3117}

### [sev 2] material @ t=13.40s — 1/1 runs — **EYEWITNESS ✓ (B+A)**
- **A:** Matte, textured finish on the key surfaces.
- **B:** Smooth, glossy finish on the key surfaces.
- **Fix (advisory):** Add a subtle bump map to the key material.
- **Channel B (Gemini):** supported — Clip A shows a flat, matte, and textured paper-like finish on the surfaces, whereas Clip B shows 3D tiles with a smooth, glossy finish that reflects light on the edges and surfaces.
- **Channel A (Claude):** supported — A's lockup key surfaces read soft matte with fine grain; B's carry a glossier clearcoat sheen.

## Killed in verification
### [sev 3] lighting @ t=13.20s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** Pronounced vignette with darker corners.
- **B:** Flat, uniform lighting across the frame.
- **Fix (advisory):** Add a vignette to darken the corners.
- **Measurement:** {"corner_mean":209.26,"center_mean":193.58,"falloff_pct":-8.1} vs {"corner_mean":150.13,"center_mean":156.92,"falloff_pct":4.32}

### [sev 3] lighting @ t=13.80s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** Deep shadows in the gaps between keys.
- **B:** Light, washed-out shadows in the gaps.
- **Fix (advisory):** Increase shadow depth and contrast.
- **Measurement:** {"p01":4.46,"p1":86.3,"p5":91.72,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.02,"span_p5_p95":139.75} vs {"p01":73.18,"p1":74.68,"p5":80.1,"p50":169.27,"p95":182.55,"p99":187.17,"p999":239.38,"span_p5_p95":102.45}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

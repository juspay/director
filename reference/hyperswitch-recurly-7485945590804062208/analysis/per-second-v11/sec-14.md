# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply a vignette effect, deepen the shadow black levels between the tiles to restore depth, and adjust the camera focal length to match the wider reference framing.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] lighting @ t=14.20s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Pronounced vignette with darker corners and soft shadow falloff on the background tiles.
- **B:** Flat, uniform illumination across the frame with minimal corner shading.
- **Fix (advisory):** Apply a vignette effect and soften the shadow rendering.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":150.43,"center_mean":155.68,"falloff_pct":3.37}

### [sev 3] lighting @ t=14.25s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows between the blocks are deep black.
- **B:** The shadows between the blocks are light grey and lack depth.
- **Fix (advisory):** Deepen the black levels in the color grading.
- **Measurement:** {"p01":3.4,"p1":85.8,"p5":91.37,"p50":208.97,"p95":231.47,"p99":236.19,"p999":251.92,"span_p5_p95":140.1} vs {"p01":72.97,"p1":74.68,"p5":80.1,"p50":168.62,"p95":182.4,"p99":188.61,"p999":239.8,"span_p5_p95":102.3}

### [sev 2] camera @ t=14.20s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** Wider field of view showing more surrounding tile layout.
- **B:** Narrower field of view resulting in a tighter crop on the central elements.
- **Fix (advisory):** Adjust the camera focal length to match the reference framing.
- **Channel B:** The claim is reversed. Clip B shows the 3D tile layout with surrounding tiles visible, whereas Clip A has a flat, blurry background and does not show the surrounding tile layout.

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

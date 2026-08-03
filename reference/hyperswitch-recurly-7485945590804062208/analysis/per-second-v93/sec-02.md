# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the camera position and rotation to match the closer perspective, apply the brushed metal texture map to the right background panel, and increase lighting contrast by adding a vignette and deepening the soft shadows beneath the tiles.

## Verified / surviving claims
### [sev 3] material @ t=2.50s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** A brushed metal texture is visible on the background block to the right of the tiles.
- **B:** The background block to the right of the tiles is flat grey with no brushed texture.
- **Fix (advisory):** Apply a brushed metal texture map to the background plate on the right.
- **Channel B (Gemini):** supported — In Clip A, a brushed metal texture is clearly visible on the background block to the right of the 'Subscriptions' and 'Retries' tiles. In Clip B, this same background block is a flat, smooth grey with no texture.
- **Channel A (Claude):** supported — A's background metal tiles carry heavy visible brushing; B's read faint. Same finding as 03:1.

### [sev 3] lighting @ t=2.50s — 2/3 runs — **MEASURED ✓**
- **A:** Deep, distinct soft shadows are visible beneath the 'Subscriptions', 'Retries', and 'APMs' tiles.
- **B:** The shadows beneath the tiles are extremely faint and diffuse, lacking depth.
- **Fix (advisory):** Increase the intensity of the key light and adjust shadow bias/diffusion to create deeper soft shadows.
- **Measurement:** {"p01":69.86,"p1":84.41,"p5":110.45,"p50":207.96,"p95":246.13,"p99":249,"p999":250.96,"span_p5_p95":135.68} vs {"p01":80.3,"p1":101.45,"p5":124.4,"p50":205.37,"p95":221.39,"p99":223.39,"p999":253.58,"span_p5_p95":96.99}

### [sev 2] camera @ t=2.10s — 3/3 runs — **MEASURED ✓**
- **A:** The camera is positioned closer to the 'Secure Payments' tile with a more dynamic, tilted angle.
- **B:** The camera is further away with a flatter, less tilted perspective.
- **Fix (advisory):** Adjust the camera's position and rotation to match the closer, more dynamic angle of Video A.
- **Measurement:** {"lap_var":506.04} vs {"lap_var":18.74}

## Killed in verification
### [sev 3] lighting @ t=2.10s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with distinct corner light falloff.
- **B:** Flat, uniform lighting across the frame with no vignette.
- **Fix (advisory):** Add a vignette in post-production.
- **Measurement:** {"corner_mean":189.19,"center_mean":209.68,"falloff_pct":9.77} vs {"corner_mean":191.3,"center_mean":211.5,"falloff_pct":9.55}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

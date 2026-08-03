# Second 12 — original frames 360-389

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Re-align the camera position and angle to capture the dynamic perspective, and adjust the lighting to introduce soft shadows and a vignette.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=12.00s — 3/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera is positioned closer to the yellow Recurly block, creating a tighter composition.
- **B:** The camera is positioned further away, showing a wider view that includes the blue Juspay hyperswitch block.
- **Fix (advisory):** Match the camera distance and framing of the reference video.
- **Channel B:** The claim states that Clip A has a tighter composition closer to the yellow Recurly block, while Clip B shows a wider view that includes the blue Juspay hyperswitch block. However, both Clip A and Clip B clearly show both the yellow Recurly block and the blue Juspay hyperswitch block in their entirety, refuting the claim.

### [sev 2] lighting @ t=12.40s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene has a distinct vignette with darker corners and deeper shadows.
- **B:** The scene has bright, flat lighting with minimal corner falloff.
- **Fix (advisory):** Apply a stronger vignette and deepen the shadows to match the reference.
- **Measurement:** {"corner_mean":209.37,"center_mean":194.05,"falloff_pct":-7.9} vs {"corner_mean":208.26,"center_mean":190.75,"falloff_pct":-9.18}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

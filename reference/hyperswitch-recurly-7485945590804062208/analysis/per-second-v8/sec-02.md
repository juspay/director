# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Animate the camera after the cut to match the reference's motion, restore the missing yellow card, and add the vignette and contact shadows.

## Verified / surviving claims
### [sev 3] camera @ t=2.50s — 2/3 runs — **MEASURED ✓**
- **A:** Camera slowly pans and rotates, shifting perspective on the cards.
- **B:** Camera remains completely static after the cut.
- **Fix (advisory):** Animate the camera to match the reference's slow pan and rotation.
- **Measurement:** {"mean_abs_delta":3.5985,"frames":30} vs {"mean_abs_delta":0.7104,"frames":30}

### [sev 3] lighting @ t=2.50s — 2/3 runs — **MEASURED ✓**
- **A:** Deep contact shadows under the cards create a strong sense of depth.
- **B:** Faint contact shadows make the cards appear flat against the background.
- **Fix (advisory):** Increase the intensity of contact shadows and ambient occlusion.
- **Measurement:** {"p01":69.86,"p1":84.41,"p5":110.45,"p50":207.96,"p95":246.13,"p99":249,"p999":250.96,"span_p5_p95":135.68} vs {"p01":80.44,"p1":101.9,"p5":126.89,"p50":209.52,"p95":226.24,"p99":229.24,"p999":253.58,"span_p5_p95":99.35}

## Killed in verification
### [sev 3] camera @ t=2.10s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** Camera is closer and tilted, showing the yellow card at the bottom.
- **B:** Camera is further away, missing the yellow card entirely.
- **Fix (advisory):** Adjust camera position and rotation.
- **Channel B:** Clip B does not miss the yellow card entirely; a yellow card is clearly visible in the top-left corner of the frame.

### [sev 3] lighting @ t=2.10s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners and soft light falloff.
- **B:** Flat, even lighting across the frame with no visible vignette.
- **Fix (advisory):** Add a vignette in post-production to match the reference.
- **Measurement:** {"corner_mean":189.19,"center_mean":209.68,"falloff_pct":9.77} vs {"corner_mean":193.82,"center_mean":214.53,"falloff_pct":9.65}

## Present in A, absent in B (corroborated, unverified inventory)
- yellow card
- vignette
- camera motion after cut

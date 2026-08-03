# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera position, rotation, and focal length to match the tighter framing and perspective angles of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=2.10s — 2/3 runs — **MEASURED ✓**
- **A:** The 'Secure Payments' tile is framed closely, occupying most of the center-left of the screen.
- **B:** The camera is positioned further back, showing a wider view with a large blue tile visible in the top-left corner.
- **Fix (advisory):** Adjust the camera position and focal length to match the tighter framing of the reference.
- **Measurement:** {"r":188.21,"g":200.46,"b":204.01,"rb_delta":-15.8,"saturation":0.2023} vs {"r":198.53,"g":209.6,"b":229.8,"rb_delta":-31.28,"saturation":0.1832}

### [sev 3] staging @ t=2.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The stacked tiles are rotated at a steep angle, showing strong perspective depth.
- **B:** The stacked tiles are nearly parallel to the camera view, showing very little perspective tilt.
- **Fix (advisory):** Rotate the tiles or adjust the camera angle to match the perspective depth of the reference.
- **Channel B:** In Clip A, the camera is positioned at a sharp, oblique angle relative to the plane of the tiles, creating a strong perspective depth effect. In Clip B, the camera is positioned almost directly above the tiles, making them nearly parallel to the camera view with very little perspective tilt.

### [sev 3] lighting @ t=2.50s — 2/3 runs — **MEASURED ✓**
- **A:** Distinct, soft contact shadows are visible beneath the 'Subscriptions', 'Retries', and 'APMs' cards, creating depth.
- **B:** The contact shadows beneath the cards are extremely faint, making the cards appear flat against the background.
- **Fix (advisory):** Increase the shadow density or adjust the light source to cast more pronounced contact shadows under the cards.
- **Measurement:** {"p01":69.86,"p1":84.41,"p5":110.45,"p50":207.96,"p95":246.13,"p99":249,"p999":250.96,"span_p5_p95":135.68} vs {"p01":63.32,"p1":96.55,"p5":169.94,"p50":217.3,"p95":242.17,"p99":244.95,"p999":254.07,"span_p5_p95":72.23}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the keyboard layout and materials to include the yellow key and brushed metal textures, and apply a high-contrast color grade to match the reference.

## Verified / surviving claims
### [sev 2] camera @ t=2.10s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** Camera is positioned close to the 'Secure Payments' card, framing it centrally with a yellow card visible at the bottom.
- **B:** Camera is further away and at a shallower angle, with no yellow card visible at the bottom.
- **Fix (advisory):** Adjust camera distance and angle to match the reference framing.
- **Channel B (Gemini):** supported — The claim accurately describes the differences in camera framing and the visibility of the yellow card at the bottom between Clip A and Clip B.
- **Channel A (Claude):** supported — Both halves check: B is more top-down than A's shallower dramatic angle, and the accent lottery left no yellow card at B's top-left this second.

### [sev 3] lighting @ t=2.10s — 2/3 runs — **MEASURED ✓**
- **A:** Crevices between keyboard tiles have deep, dark shadows, providing high contrast.
- **B:** Crevices are brightly lit with very soft, shallow shadows, resulting in a flat look.
- **Fix (advisory):** Increase shadow depth and contrast in the crevices.
- **Measurement:** {"p01":55.31,"p1":79.89,"p5":89.83,"p50":207.53,"p95":243.22,"p99":246.59,"p999":249.59,"span_p5_p95":153.39} vs {"p01":92.23,"p1":110.13,"p5":131.98,"p50":207.59,"p95":224.67,"p99":226.67,"p999":246.3,"span_p5_p95":92.69}

### [sev 4] material @ t=2.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** A brushed metal texture strip is visible to the right of the Subscriptions, Retries, and APMs cards.
- **B:** The surface to the right of the cards is a flat, solid grey color with no brushed texture.
- **Fix (advisory):** Apply a brushed metal material to the background strip on the right side.
- **Channel B (Gemini):** supported — The comparison is accurate. In Clip A, a brushed metal texture strip is clearly visible to the right of the Subscriptions, Retries, and APMs cards, whereas in Clip B, the surface to the right of these cards is a flat, solid grey color with no texture.
- **Channel A (Claude):** supported — A's brushed strip beside the column is prominent; B's equivalent metal tile reads faint.

## Killed in verification
### [sev 3] staging @ t=2.30s — 2/3 runs — **EYEWITNESS REFUTED ✗ (B)**
- **A:** A bright yellow key is visible at the top-left corner of the frame.
- **B:** Only white/light gray keys are visible in the top-left corner.
- **Fix (advisory):** Add the yellow key to the top-left area of the keyboard layout.
- **Channel B (Gemini):** refuted — In Clip B, a yellow key is clearly visible in the top-left corner of the frame from 00:00.000 to 00:00.583, contradicting the claim that only white/light gray keys are visible there.

## Present in A, absent in B (corroborated, unverified inventory)
- yellow key in top-left corner
- brushed metal texture on the right key

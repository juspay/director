# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Increase the vignette strength and adjust the camera framing to be tighter on the central card.

## Verified / surviving claims
### [sev 3] color @ t=0.50s — 2/3 runs — **MEASURED ✓**
- **A:** Blue shield icon is highly saturated.
- **B:** Blue shield icon is desaturated.
- **Fix (advisory):** Increase the saturation of the blue materials.
- **Measurement:** {"r":189.28,"g":198.82,"b":201.38,"rb_delta":-12.1,"saturation":0.2001} vs {"r":190.71,"g":196.81,"b":210.82,"rb_delta":-20.11,"saturation":0.0944}

## Killed in verification
### [sev 3] camera @ t=0.10s — 3/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** Tighter camera framing on the central card.
- **B:** Wider camera framing showing more background.
- **Fix (advisory):** Adjust camera zoom or position closer to the subject.
- **Channel B (Gemini):** supported — Clip A shows a much tighter framing on the 'Secure Payments' card, while Clip B has a wider camera angle that reveals more of the surrounding cards and background.
- **Channel A (Claude):** refuted — Distance family, fifth consecutive parity refutation.

### [sev 3] lighting @ t=0.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with pronounced corner shading.
- **B:** Weak vignette with bright corners.
- **Fix (advisory):** Increase camera vignette intensity.
- **Measurement:** {"corner_mean":202.03,"center_mean":205.44,"falloff_pct":1.66} vs {"corner_mean":179.89,"center_mean":210.75,"falloff_pct":14.64}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

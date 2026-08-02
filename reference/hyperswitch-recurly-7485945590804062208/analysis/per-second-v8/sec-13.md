# Second 13 — original frames 390-419

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enable depth of field on the camera and adjust the aperture to match the reference video's blur.

## Verified / surviving claims
### [sev 3] camera @ t=13.80s — 1/1 runs — **MEASURED ✓**
- **A:** The background cards are heavily blurred due to a shallow depth of field.
- **B:** The background cards remain sharp and in focus.
- **Fix (advisory):** Enable depth of field on the camera and adjust the aperture to match the reference.
- **Measurement:** {"lap_var":0.98} vs {"lap_var":3.61}

## Killed in verification
### [sev 3] lighting @ t=13.50s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The blue card casts a soft, realistic contact shadow onto the white surface below it.
- **B:** The blue card has almost no contact shadow, appearing flatly lit.
- **Fix (advisory):** Adjust the light sources to cast softer, more realistic contact shadows.
- **Measurement:** {"p01":4.46,"p1":86.22,"p5":90.44,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.14,"span_p5_p95":141.03} vs {"p01":89.96,"p1":90.96,"p5":97.3,"p50":192.88,"p95":211.67,"p99":215.72,"p999":239.57,"span_p5_p95":114.37}

### [sev 3] color @ t=13.50s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** The white surfaces have a subtle cool blue-grey color cast.
- **B:** The white surfaces are neutral grey/white with no color cast.
- **Fix (advisory):** Adjust the color grading to introduce cool blue-grey tones.
- **Measurement:** {"r":194.53,"g":204.41,"b":200.72,"rb_delta":-6.2,"saturation":0.1862} vs {"r":169.11,"g":176.03,"b":190.21,"rb_delta":-21.1,"saturation":0.1953}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

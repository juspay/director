# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Match the camera focal length to correct the perspective distortion and key layout, and delay the 'Live Now' pill animation timing.

## Verified / surviving claims
### [sev 3] camera @ t=8.25s — 3/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The camera is at a lower, more oblique angle, showing stronger perspective.
- **B:** The camera is at a higher, flatter angle with less perspective.
- **Fix (advisory):** Lower the camera and tilt up to match the oblique angle.
- **Channel B (Gemini):** supported — The camera in Clip A is indeed at a lower, more oblique angle, which creates a stronger perspective effect. In Clip B, the camera is positioned higher, looking more directly down at the surface, resulting in a flatter angle with less perspective distortion.
- **Channel A (Claude):** supported — Same finding upheld last pass at this second: B more directly overhead than A.

### [sev 3] motion @ t=8.70s — 3/3 runs — **MEASURED ✓**
- **A:** The 'Live Now' pill is actively sliding upward.
- **B:** The 'Live Now' pill has completed its motion and is stationary.
- **Fix (advisory):** Delay the keyframes of the pill animation.
- **Measurement:** {"mean_abs_delta":2.9309,"frames":30} vs {"mean_abs_delta":1.0925,"frames":30}

### [sev 3] lighting @ t=8.50s — 3/3 runs — **MEASURED ✓**
- **A:** The corners of the frame are significantly darker than the center, showing a strong vignette.
- **B:** The corners of the frame are nearly as bright as the center, with a very weak vignette.
- **Fix (advisory):** Increase the vignette strength in the camera or post-processing.
- **Measurement:** {"corner_mean":174.81,"center_mean":180.43,"falloff_pct":3.11} vs {"corner_mean":150.48,"center_mean":146.42,"falloff_pct":-2.77}

### [sev 2] color @ t=8.50s — 3/3 runs — **MEASURED ✓**
- **A:** The yellow Recurly card has a warm golden hue.
- **B:** The yellow Recurly card has a cooler, greenish-yellow hue.
- **Fix (advisory):** Warm up the yellow diffuse material color.
- **Measurement:** {"r":168.23,"g":177.79,"b":186.98,"rb_delta":-18.75,"saturation":0.2316} vs {"r":128.04,"g":143.79,"b":186.87,"rb_delta":-58.83,"saturation":0.3689}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

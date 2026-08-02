# Second 14 — original frames 420-449

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Increase contrast, apply a stronger vignette, and boost the saturation of the cards to match the reference video.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 2] lighting @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Stronger vignette darkening the corners.
- **B:** Bright corners with weak vignette.
- **Fix (advisory):** Increase vignette strength.
- **Measurement:** {"corner_mean":208.82,"center_mean":192.76,"falloff_pct":-8.33} vs {"corner_mean":176.35,"center_mean":175.42,"falloff_pct":-0.53}

### [sev 2] color @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Deeper shadows and higher contrast.
- **B:** Flatter image with washed-out shadows.
- **Fix (advisory):** Adjust luma curve to increase contrast.
- **Measurement:** {"p01":4.28,"p1":86.02,"p5":91.58,"p50":208.96,"p95":231.47,"p99":236.19,"p999":251.6,"span_p5_p95":139.89} vs {"p01":60.08,"p1":60.86,"p5":66.66,"p50":190.35,"p95":207.5,"p99":210.74,"p999":237.35,"span_p5_p95":140.84}

### [sev 3] color @ t=14.20s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Warmer color cast with more saturated yellow and blue tones on the cards.
- **B:** Cooler, more neutral color cast with desaturated tones.
- **Fix (advisory):** Apply a warm color grade and boost saturation.
- **Measurement:** {"r":194.72,"g":204.52,"b":200.82,"rb_delta":-6.1,"saturation":0.1835} vs {"r":165.68,"g":173.37,"b":184.92,"rb_delta":-19.24,"saturation":0.1996}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

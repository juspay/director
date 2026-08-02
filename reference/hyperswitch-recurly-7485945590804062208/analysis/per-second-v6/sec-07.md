# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 3 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Increase overall scene contrast, apply a brushed metal material to the card border, and increase the saturation of the blue card.

## Verified / surviving claims
### [sev 3] material @ t=7.50s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** The card border shows a brushed metal texture with anisotropic reflections.
- **B:** The card border is a flat, non-reflective grey.
- **Fix (advisory):** Apply a brushed metal material to the card border.
- **Channel B (Gemini):** supported — In Clip A, the border around the blue 'JUSPAY hyperswitch' card clearly shows a brushed metal texture with horizontal anisotropic reflections. In Clip B, the border is a flat, solid grey with no texture or reflections.
- **Channel A (Claude):** supported — A's plinth shows strong brushed striations with directional highlight response. B's bezel is a near-uniform mid-grey with only a faint texture and no anisotropic behaviour — the difference as stated is plainly visible. (Unrelated observation for the next round: B's Revenue Analytics bars render emissive neon-orange against A's flat gold.)

### [sev 2] color @ t=7.30s — 2/3 runs — **MEASURED ✓**
- **A:** The blue card is highly saturated and vibrant.
- **B:** The blue card is desaturated and dull.
- **Fix (advisory):** Increase saturation of the blue material.
- **Measurement:** {"r":174.9,"g":184.56,"b":199.52,"rb_delta":-24.62,"saturation":0.2429} vs {"r":154.94,"g":159.77,"b":188.1,"rb_delta":-33.16,"saturation":0.1898}

## Killed in verification
### [sev 3] lighting @ t=7.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The scene has high contrast with bright specular highlights on metallic edges and deep shadows.
- **B:** The scene has low contrast with flat, diffused lighting and soft grey shadows.
- **Fix (advisory):** Increase directional lighting contrast to create stronger highlights and shadows.
- **Measurement:** {"p01":65.23,"p1":69.47,"p5":75.95,"p50":200.32,"p95":246.42,"p99":247.86,"p999":253.09,"span_p5_p95":170.47} vs {"p01":13.8,"p1":29.68,"p5":31.76,"p50":185.93,"p95":207.5,"p99":209.36,"p999":254.86,"span_p5_p95":175.74}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 13 — original frames 390-419

_1/3 runs passed the ground-truth timing check; 0 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply a metallic material with high specularity to the borders of the cards to match the reflective look of the reference.

## Verified / surviving claims
### [sev 3] camera @ t=13.50s — 1/1 runs — **MEASURED ✓**
- **A:** Background cards are heavily blurred due to a shallow depth of field.
- **B:** Background cards are sharp and fully in focus.
- **Fix (advisory):** Reduce the camera f-stop to achieve a shallower depth of field.
- **Measurement:** {"lap_var":0.96} vs {"lap_var":3.06}

### [sev 4] material @ t=13.70s — 1/1 runs — **MEASURED ✓**
- **A:** The border of the Juspay card is a highly reflective metallic silver.
- **B:** The border is a flat matte grey with no metallic reflection.
- **Fix (advisory):** Apply a metallic material with high specularity to the card border.
- **Measurement:** {"p01":4.25,"p1":86.3,"p5":91.09,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.02,"span_p5_p95":140.38} vs {"p01":60.08,"p1":61.43,"p5":66.51,"p50":190.74,"p95":207.5,"p99":210.73,"p999":237.14,"span_p5_p95":140.99}

## Killed in verification
### [sev 3] lighting @ t=13.80s — 1/1 runs — **MEASUREMENT VETO ✗**
- **A:** Deep shadows are visible in the crevices between the tiles, creating high contrast.
- **B:** Crevices have very soft, light shadows, resulting in a flat look.
- **Fix (advisory):** Adjust the shadow settings and key light to deepen contact shadows.
- **Measurement:** {"p01":4.46,"p1":86.3,"p5":91.72,"p50":209.01,"p95":231.47,"p99":236.33,"p999":252.02,"span_p5_p95":139.75} vs {"p01":60.08,"p1":61.43,"p5":66.66,"p50":190.72,"p95":207.5,"p99":210.8,"p999":237.35,"span_p5_p95":140.84}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

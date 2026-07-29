# Second 2 — original frames 60-89

_3/3 runs passed the ground-truth timing check; 3 single-run claims discarded._

## Highest-impact fix
Re-stage the shot to remove the incorrect 'Success rate' chart, align the Subscriptions, Retries, and APMs cards in a clean vertical column, and animate them rising vertically with a smooth ease-out instead of sliding in horizontally.

## Corroborated differences
### [sev 4] staging — 2/3 runs
- **A:** Arranges the Subscriptions, Retries, and APMs cards in a clean, centered vertical column.
- **B:** Clutters the frame with a 'Success rate' graph/chart, disrupting the vertical alignment of the cards.
- **Fix:** Remove the 'Success rate' graph/chart and align the three cards in a clean, centered vertical column.

### [sev 4] motion — 2/3 runs
- **A:** Animates the cards rising vertically with a smooth ease-out or spring curve.
- **B:** Animates the cards sliding in horizontally or diagonally from the left with a stiff, linear motion.
- **Fix:** Restrict the card animation to the vertical axis and apply a smooth ease-out or spring curve.

### [sev 3] material — 2/3 runs
- **A:** Features clean, solid background surfaces with a realistic brushed metal texture.
- **B:** Uses a flat background with an incorrect dotted or dot-grid pattern.
- **Fix:** Remove the dotted pattern and apply a clean, brushed metal texture to the background panel.

### [sev 3] lighting — 2/3 runs
- **A:** Employs soft, realistic contact shadows beneath the cards and in crevices.
- **B:** Uses flat, diffuse lighting with weak or unrealistic contact shadows.
- **Fix:** Increase directional light contribution and shadow softness to produce realistic contact shadows.

## Present in A, absent in B
- The clean, brushed metal background texture behind the cards.
- The clean vertical column alignment of the three cards.

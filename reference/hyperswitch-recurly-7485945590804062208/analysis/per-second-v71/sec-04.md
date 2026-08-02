# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the lighting and shadow settings to match the high-contrast look of the reference video.

## Verified / surviving claims
### [sev 3] staging @ t=4.20s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** A yellow tile is visible in the top-left corner.
- **B:** No yellow tile is visible in the top-left corner.
- **Fix (advisory):** Adjust background tile layout to include the yellow tile.
- **Channel B:** In Clip A, a yellow horizontal tile/bar is clearly visible in the top-left corner under the word 'Billing'. In Clip B, this yellow tile is not present in the top-left corner.

### [sev 3] lighting @ t=4.50s — 3/3 runs — **MEASURED ✓**
- **A:** Strong, soft shadows are cast by the cards, creating high contrast.
- **B:** Shadows are extremely faint, resulting in flat lighting and low contrast.
- **Fix (advisory):** Adjust light source and shadow settings to increase contrast.
- **Measurement:** {"p01":64.21,"p1":76.5,"p5":133.38,"p50":208.3,"p95":245.71,"p99":249.14,"p999":251.01,"span_p5_p95":112.33} vs {"p01":72.53,"p1":93.2,"p5":122.76,"p50":195.37,"p95":218.39,"p99":219.68,"p999":254,"span_p5_p95":95.63}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 0 — original frames 0-29

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Correct the text rotation on the 'Secure Payments' tile and adjust the camera framing to be much closer.

## Verified / surviving claims
### [sev 3] camera @ t=0.20s — 3/3 runs — **eyewitness pending (channel B: supported)**
- **A:** Tight close-up framing on the 'Secure Payments' tile.
- **B:** Wider camera framing with the tile rotated and smaller.
- **Fix (advisory):** Match reference camera distance and angle.
- **Channel B:** Clip A shows a tight close-up on the 'Secure Payments' tile, which is oriented almost vertically. Clip B shows a wider shot where the tile is smaller in the frame and rotated diagonally.

## Killed in verification
### [sev 3] layout @ t=0.20s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The text 'Secure Payments' is oriented horizontally, aligned with the shield icon.
- **B:** The text 'Secure Payments' is rotated 90 degrees relative to the shield icon, running vertically.
- **Fix (advisory):** Rotate the text element to align horizontally with the shield icon.
- **Channel B:** In Clip B, both the shield icon and the text 'Secure Payments' are rotated by 90 degrees together (the entire design on the card is rotated), meaning the text is not rotated 90 degrees relative to the shield icon; their relative orientation remains the same as in Clip A.

### [sev 2] lighting @ t=0.80s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** Strong vignette with darker corners.
- **B:** Flat, uniform illumination across the frame.
- **Fix (advisory):** Add corner vignette.
- **Measurement:** {"corner_mean":204.05,"center_mean":203.81,"falloff_pct":-0.11} vs {"corner_mean":210.83,"center_mean":226.01,"falloff_pct":6.72}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

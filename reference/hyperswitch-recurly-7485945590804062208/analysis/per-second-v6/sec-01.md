# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 2 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Apply the correct blue and yellow materials to the background tiles to match the vibrant color scheme of the reference.

## Verified / surviving claims
### [sev 3] color @ t=1.00s — 3/3 runs — **MEASURED ✓**
- **A:** The tile to the left of 'Secure Payments' is bright blue, and the tile below it is bright yellow.
- **B:** The tiles to the left and below 'Secure Payments' are off-white and gray, completely lacking blue and yellow colors.
- **Fix (advisory):** Apply the correct blue and yellow materials/colors to the surrounding tiles in the layout.
- **Measurement:** {"r":190.87,"g":200.41,"b":203.06,"rb_delta":-12.19,"saturation":0.1984} vs {"r":196.2,"g":196.64,"b":195.83,"rb_delta":0.37,"saturation":0.0371}

## Killed in verification
### [sev 2] camera @ t=1.20s — 2/3 runs — **EYEWITNESS REFUTED ✗**
- **A:** The camera has a tight focal length and perspective tilt, showing the 'Secure Payments' tile at a steep angle close to the lens.
- **B:** The camera is positioned further back with a flatter angle of view, showing more of the surrounding grid.
- **Fix (advisory):** Match the camera's position, rotation, and focal length to the reference video to capture the same dramatic perspective.
- **Channel B:** The claim swaps the descriptions of the camera angles. In Clip A, the 'Secure Payments' tile is viewed almost straight-on (flat angle), whereas in Clip B, the camera is positioned at a steep, oblique angle relative to the tile.

### [sev 2] lighting @ t=1.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The corners of the frame are significantly darker than the center, creating a strong vignette effect.
- **B:** The illumination is uniform across the entire frame, with no corner falloff.
- **Fix (advisory):** Add a vignette effect or adjust the light source to create corner falloff.
- **Measurement:** {"corner_mean":203.84,"center_mean":204.62,"falloff_pct":0.39} vs {"corner_mean":194.27,"center_mean":201.44,"falloff_pct":3.56}

## Present in A, absent in B (corroborated, unverified inventory)
- blue and yellow colored tiles in the surrounding grid

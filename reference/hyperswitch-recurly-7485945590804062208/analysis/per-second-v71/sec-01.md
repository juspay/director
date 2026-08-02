# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Reorganize the grid layout of the tiles to match the color and placement of the reference composition.

## Verified / surviving claims
### [sev 3] layout @ t=1.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The surrounding tiles include a yellow metallic tile at the bottom and a blue tile on the left, with 'Renewal Success' directly above 'Secure Payments'.
- **B:** The surrounding tiles are mostly grey and white, with 'Renewal Success' shifted to the top-right and a lined tile at the bottom-right.
- **Fix (advisory):** Reorganize the grid layout of the tiles to match the color and placement of the reference composition.
- **Channel B:** The visual details described for both Clip A and Clip B are accurate. Clip A shows a yellow metallic tile at the bottom, a blue tile on the left, and 'Renewal Success' directly above 'Secure Payments'. Clip B shows mostly grey and white surrounding tiles, with 'Renewal Success' shifted to the top-right and a lined tile at the bottom-right.

### [sev 2] color @ t=1.50s — 2/3 runs — **MEASURED ✓**
- **A:** The shadows are deeper, and the colors (especially the blue shield icon) are richer and more saturated.
- **B:** The shadows are washed out, and the blue shield icon is less saturated, appearing pale.
- **Fix (advisory):** Increase contrast and saturation, particularly in the midtones and shadows, to match the reference's color profile.
- **Measurement:** {"r":193.3,"g":205.55,"b":228.77,"rb_delta":-35.46,"saturation":0.1564} vs {"r":200.52,"g":207.16,"b":221.87,"rb_delta":-21.35,"saturation":0.092}

## Killed in verification
### [sev 2] lighting @ t=1.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** There is a distinct vignette with darker corners, creating depth and focusing attention on the center tile.
- **B:** The lighting is flat and uniform across the frame, lacking any noticeable vignette or corner falloff.
- **Fix (advisory):** Add a vignette in post-processing or adjust the light sources to create a stronger corner-to-center falloff.
- **Measurement:** {"corner_mean":203.84,"center_mean":204.62,"falloff_pct":0.39} vs {"corner_mean":187.37,"center_mean":206.81,"falloff_pct":9.4}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

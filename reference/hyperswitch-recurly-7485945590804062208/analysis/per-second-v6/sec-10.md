# Second 10 — original frames 300-329

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the camera framing and distance to match the close-up perspective of the reference video.

## Verified / surviving claims
### [sev 3] camera @ t=10.50s — 3/3 runs — **MEASURED ✓**
- **A:** The camera is framed closer to the tiles, making the yellow Recurly tile appear larger and more prominent.
- **B:** The camera is framed further away, showing more of the grid and making the yellow tile smaller.
- **Fix (advisory):** Adjust camera position and focal length to match the reference framing.
- **Measurement:** {"lap_var":423.16} vs {"lap_var":34.38}

## Killed in verification
### [sev 3] lighting @ t=10.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The lighting has a distinct vignette with darker corners and soft falloff.
- **B:** The lighting is flat and uniform across the frame with no corner falloff.
- **Fix (advisory):** Add a vignette to match the corner darkening of the reference.
- **Measurement:** {"corner_mean":210.78,"center_mean":196.59,"falloff_pct":-7.22} vs {"corner_mean":181.23,"center_mean":175.13,"falloff_pct":-3.48}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

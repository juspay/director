# Second 7 — original frames 210-239

_3/3 runs passed the ground-truth timing check; 1 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Enable shallow depth of field on the camera to blur background elements and adjust the layout of the surrounding tiles to match the reference.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=7.30s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** Background tiles are blurry due to shallow depth of field.
- **B:** Background tiles are sharp with no depth of field blur.
- **Fix (advisory):** Enable camera depth of field and adjust focus.
- **Measurement:** {"lap_var":73.28} vs {"lap_var":11.94}

### [sev 3] color @ t=7.30s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The blue 'hyperswitch' card is highly saturated royal blue.
- **B:** The blue card is desaturated and dull.
- **Fix (advisory):** Increase saturation of the blue material.
- **Measurement:** {"r":174.9,"g":184.56,"b":199.52,"rb_delta":-24.62,"saturation":0.2429} vs {"r":171.1,"g":168.09,"b":197.41,"rb_delta":-26.31,"saturation":0.2234}

### [sev 3] layout @ t=7.20s — 2/3 runs — **EYEWITNESS REFUTED ✗ (A)**
- **A:** The 'Revenue Analytics' tile is to the top-right of the 'JUSPAY' tile.
- **B:** The 'Revenue Analytics' tile is to the top-left of the 'JUSPAY' tile.
- **Fix (advisory):** Reposition the surrounding tiles to match reference layout.
- **Channel B (Gemini):** supported — In Clip A, the 'Revenue Analytics' tile is located to the top-right of the 'JUSPAY hyperswitch' tile, whereas in Clip B, it is located to the top-left of the 'JUSPAY hyperswitch' tile.
- **Channel A (Claude):** refuted — In B the Revenue Analytics tile sits up and to the RIGHT of the JUSPAY card (tile centre ~x560 vs card centre ~x390), same relative side as A — not 'top-left'. Second consecutive false left/right relative-position claim endorsed by channel B.

## Present in A, absent in B (corroborated, unverified inventory)
- shallow depth of field blur

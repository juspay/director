# Second 8 — original frames 240-269

_3/3 runs passed the ground-truth timing check; 8 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Enable depth of field on the camera and adjust focus distance to match the reference's shallow depth of field.

## Verified / surviving claims
_None._

## Killed in verification
### [sev 3] camera @ t=8.50s — 2/3 runs — **MEASUREMENT VETO ✗**
- **A:** The background tiles in the top-right corner are heavily blurred due to a shallow depth of field.
- **B:** The background tiles are in sharp focus, indicating a much wider depth of field.
- **Fix (advisory):** Enable depth of field on the camera and adjust focus distance to blur the background.
- **Measurement:** {"lap_var":76.26} vs {"lap_var":3.2}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

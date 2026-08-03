# Second 1 — original frames 30-59

_3/3 runs passed the ground-truth timing check; 4 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
Adjust the lighting to use softer, more diffused shadows and correct the camera's roll rotation to match the reference framing.

## Verified / surviving claims
### [sev 3] camera @ t=1.50s — 2/3 runs — **eyewitness pending (channel B: supported)**
- **A:** The camera roll is aligned such that the grid lines are tilted at a shallow angle of approximately 15 degrees.
- **B:** The camera roll is tilted much further, with the grid lines running at a steep diagonal angle of around 35 degrees.
- **Fix (advisory):** Adjust the camera's roll rotation to match the reference framing.
- **Channel B:** The camera roll in Clip A is indeed tilted at a shallow angle of approximately 15 degrees, whereas in Clip B, the camera is rotated significantly more, resulting in the grid lines running at a steep diagonal angle of around 35 degrees.

## Killed in verification
### [sev 4] lighting @ t=1.50s — 3/3 runs — **MEASUREMENT VETO ✗**
- **A:** The shadows cast by the 'Secure Payments' card are soft, diffused, and realistic.
- **B:** The shadows cast by the 'Secure Payments' card are harsh, dark, and sharp.
- **Fix (advisory):** Use a larger light source or increase shadow blur/ambient occlusion to soften the shadows.
- **Measurement:** {"p01":44.37,"p1":85.15,"p5":89.65,"p50":221.17,"p95":249.72,"p99":251.43,"p999":253.72,"span_p5_p95":160.07} vs {"p01":17.96,"p1":48.6,"p5":97.4,"p50":229.81,"p95":239.59,"p99":244.45,"p999":254.41,"span_p5_p95":142.19}

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

# Second 4 — original frames 120-149

_3/3 runs passed the ground-truth timing check; 6 single-run claims dropped by the vote; 0 rejected by the citation firewall._

## Highest-impact fix (advisory)
Adjust the lighting to introduce a stronger vignette and more pronounced drop shadows on the card elements to match the depth and mood of the reference.

## Verified / surviving claims
### [sev 3] staging @ t=4.21s — 2/3 runs — **EYEWITNESS ✓ (B+A)**
- **A:** Pronounced soft drop shadows under the Subscriptions, Retries, and APMs cards, creating a clear sense of depth.
- **B:** Very faint or absent drop shadows, making the cards appear flat against the key surface.
- **Fix (advisory):** Add a soft drop shadow effect to the floating card elements to match the reference depth.
- **Channel B (Gemini):** supported — Clip A shows very distinct, dark drop shadows under the three cards, which gives them a strong 3D floating effect. In contrast, Clip B has very faint, almost imperceptible shadows, making the cards look flat against the surface.
- **Channel A (Claude):** supported — Decisive frames: A's three column cards FLOAT with pronounced soft drop shadows beneath them — they hover off the wall. B's sit seated (CAP_Y sinks them in) with minimal shadow. Actionable: raise the column cards and let the directional shadow render below.

### [sev 3] lighting @ t=4.92s — 2/3 runs — **MEASURED ✓**
- **A:** Strong vignette with darker corners and a bright spotlight effect on the central yellow Recurly card.
- **B:** Flat lighting across the entire frame with minimal corner falloff.
- **Fix (advisory):** Increase the vignette strength and add a subtle spotlight to the center.
- **Measurement:** {"corner_mean":199.36,"center_mean":190.67,"falloff_pct":-4.56} vs {"corner_mean":195.49,"center_mean":171.97,"falloff_pct":-13.68}

## Killed in verification
_None._

## Present in A, absent in B (corroborated, unverified inventory)
_Nothing corroborated._

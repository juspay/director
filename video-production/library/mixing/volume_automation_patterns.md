# Volume Automation Patterns

## 9-Segment Volume Automation Technique (from v8)

This technique uses a 9-segment volume envelope to shape background music
dynamically around voiceover and narrative beats. Each segment targets a
percentage of a BASE volume level, creating intentional energy contours
that reinforce the story arc.

### Segment Map

| # | Segment   | Volume Behavior                                                                 |
|---|-----------|---------------------------------------------------------------------------------|
| 1 | Hook      | Near-silent (1.5% BASE) — build gradually to 9%                                |
| 2 | MeetTara  | Crossfade to 8%                                                                |
| 3 | Collab    | Dip to 3% during "human judgment" narration                                    |
| 4 | Execution | Build to BASE, drop to near-zero before the fork, spike to 25% (bass drop), sustain 18% |
| 5 | Reach     | Ease from 18% down to 10%                                                      |
| 6 | Payoff    | Dip to 5% for reflection                                                       |
| 7 | Identity  | Climb to 12%, taper to 0 over the final 3 seconds                              |

### Design Principles

- **Voice-first**: Music stays below voiceover at all times; dips coincide
  with dense narration and key phrases.
- **Energy arc**: The Execution segment is the peak. Everything before it
  builds anticipation; everything after it resolves.
- **Bass drop as punctuation**: The 25% spike in Execution marks the
  narrative fork/turning point — a single dramatic accent, not sustained
  loudness.
- **Graceful exit**: The final 3-second taper to silence avoids abrupt
  cutoffs and lets the last words breathe.

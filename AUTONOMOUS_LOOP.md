# Autonomous execution loop

## Purpose

The Master TODO has ~130 atomic items across 6 sprints + a parallel track. To finish without manual nudging, this is the auto-resume protocol.

## Wakeup contract

1. On every wakeup, read `MASTER_TODO.md` top to bottom.
2. Find the **first `[ ]` line** that's not blocked by an unresolved `[!]` dependency.
3. Mark it `[~]` (in progress).
4. Execute it — read the relevant file, make the edit, run the validation step listed inline.
5. On success: mark `[x]` and continue with the next item until natural pause point (subsection boundary or 10-minute work unit).
6. On failure: mark `[!]`, append a one-paragraph note to `BLOCKERS.md`, advance to next non-dependent item.
7. Before returning control, call `ScheduleWakeup` with the same continuation prompt and a delay that fits the kind of pause:
   - **Short pause** (waiting on a quick test, build, network call): 270s (stays in 5-min cache window)
   - **Long pause** (waiting on a video gen LRO, multi-step pipeline): 1200-1800s (one cache miss, less burn)
8. Stop the loop only when:
   - All `[ ]` resolved (everything `[x]` or `[!]`),
   - User explicitly says stop / interrupts,
   - All non-`[!]` work blocked on a single `[!]` dependency we can't break.

## Continuation prompt (verbatim)

> Resume executing `MASTER_TODO.md`. Open the file, find the first `[ ]` item that isn't blocked, mark it `[~]`, execute its concrete steps (read referenced files, edit code, run the listed validation command), then mark `[x]`. Commit on `feat/neurolink-9.61-migration` after every completed sub-section. Skip `[!]` items but record the reason in `BLOCKERS.md`. Never modify `release` directly. After each work unit, call `ScheduleWakeup` again with this same prompt unless every `[ ]` is resolved.

## Wakeup hygiene

- Keep `reason:` field specific (not "continuing work" — say "executing 1.1.3 video-scorer migration" or "polling Veo LRO for B.4 test").
- After every `[x]` flip, run `git status` and commit if there are changes (using a feat branch).
- Track session metrics in `.pipeline-state/loop-metrics.jsonl` (one line per wakeup with `{ts, item, durationSec, status}`).

## Failure modes to watch

| Symptom | Action |
|---|---|
| Same item flips back to `[~]` from `[x]` repeatedly | Add `[!]` and write to BLOCKERS.md |
| 3 consecutive wakeups complete 0 items | Stop loop, summarize state, alert user |
| All remaining items blocked on one `[!]` | Stop loop, summarize, alert user |
| User-visible breakage in `npm test` | Pause, fix, then continue |
| Cost projection > $50 per wakeup | Pause, ask user to confirm |

## Rollback

If migration breaks the working pipeline mid-flight:
1. `git stash` current changes
2. Re-run `npm test` and Tier 0 to confirm baseline still works
3. Restore from stash one file at a time, isolating which change broke things
4. Document in BLOCKERS.md

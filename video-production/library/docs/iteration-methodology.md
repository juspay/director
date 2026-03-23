# Iteration Methodology — Video Production Pipeline

A comprehensive guide to running iterative video production across three domains: script, voiceover, and render. Each domain uses a score-driven feedback loop with explicit lock thresholds and plateau detection.

---

## 1. Script Iteration

**Goal:** Produce a locked script that scores at least 9.0/10 across all 11 criteria before any production work begins.

### Process

1. **Draft** -- Write a complete script draft covering all narrative acts.
2. **Score** -- Evaluate the draft against the 11-criterion rubric (see `scoring-rubrics.md`). Each criterion is scored 0-10.
3. **Identify weakest** -- Find the criterion with the lowest score.
4. **Fix** -- Rewrite targeted sections to address only the weakest dimension. Resist the temptation to change what already scores well.
5. **Re-score** -- Run the rubric again on the revised draft.
6. **Repeat** -- Continue the fix-and-rescore loop until every criterion meets the lock threshold.
7. **Lock** -- When the minimum score across all 11 criteria reaches 9.0 or higher, the script is locked. No further changes are permitted once locked.

### Key Principles

- **Fix one thing at a time.** Changing multiple dimensions simultaneously makes it impossible to attribute score movements.
- **Score before and after every change.** If a fix improves one criterion but regresses another, revert it.
- **Lock means lock.** Once a script is locked, production begins. Reopening a locked script resets the entire downstream pipeline.

### Lessons Learned

- v7 achieved a script score of 9.85/10 by spending the majority of effort on script quality before touching any production tooling. Script quality is the single highest-leverage investment.
- v9 demonstrated that regressions happen: the script was simplified from 8.83 to 7.33 when changes intended as improvements actually weakened narrative cohesion. Always re-score; never assume a change is an improvement.

---

## 2. Voiceover Iteration

**Goal:** Produce a locked voiceover take that maximizes acoustic quality across 8 weighted criteria using genetic optimization.

### Process

1. **Generate variants** -- For each iteration, generate 5 voiceover variants from the locked script (varying prosody, pacing, emphasis, or TTS parameters).
2. **Score acoustically** -- Evaluate each variant against the 8-criterion acoustic rubric (see `scoring-rubrics.md`). Compute the weighted composite score.
3. **Rank** -- Order variants by composite score. Identify the top-1 and top-2.
4. **Genetic crossover** -- Produce the next generation of 5 variants using three strategies:
   - **Perturb top** (2 variants): Take the best variant and make small parameter perturbations (pitch shift +/-2%, speed +/-3%, emphasis adjustments).
   - **Crossover top-2** (2 variants): Combine parameters from the top two variants (e.g., take prosody from variant A and pacing from variant B).
   - **Explore** (1 variant): Generate a random variant with parameters outside the current search space to escape local optima.
5. **Plateau detection** -- Track the best composite score across iterations. If the best score does not improve for 3 consecutive iterations, declare a plateau and lock the best variant found so far.
6. **Lock** -- The highest-scoring variant at plateau (or at any point where the score exceeds the target threshold) becomes the locked voiceover.

### Key Principles

- **Always keep the explore slot.** Without it, the optimizer converges on a local maximum and cannot escape.
- **Score acoustically, not subjectively.** The 8-criterion rubric removes human bias from variant selection.
- **Plateau is a signal, not a failure.** Plateaus indicate that the current parameter space has been exhausted. The correct response is to lock and move on, not to keep iterating.

### Lessons Learned

- v2 plateaued at 6.5 after 160 iterations. The issue was not insufficient iteration but an architecture limit -- the Remotion v2 composition system could not produce the micro-animation density required for higher scores. This proved that iteration cannot overcome a fundamental architecture ceiling.

---

## 3. Render Iteration

**Goal:** Produce a final render that scores as high as possible on the 7-dimension video rubric via targeted code fixes.

### Process

1. **Render** -- Execute a full Remotion render from the current codebase.
2. **Score** -- Run the rendered video through Gemini scoring 3 times. Average the scores across all 3 runs to reduce variance.
3. **Identify weakest dimension** -- Find the rubric dimension with the lowest average score.
4. **Code fix** -- Make a targeted code change to the Remotion composition that specifically addresses the weakest dimension. Document what was changed and why.
5. **Re-render** -- Produce a new render with the fix applied.
6. **Re-score** -- Run 3 Gemini scoring passes on the new render.
7. **Compare** -- If the weakest dimension improved without regressing other dimensions, keep the change. If any dimension regressed, revert.
8. **Repeat** -- Continue until scores plateau or the target is met.

### Key Principles

- **Three-run scoring is mandatory.** A single scoring run has too much variance. Three runs and averaging produces stable, actionable scores.
- **One fix per iteration.** As with script iteration, changing multiple things per render cycle makes regression attribution impossible.
- **Track all dimensions, not just the target.** A fix that improves transitions but regresses pacing is not a net win.

### Lessons Learned

- v5 achieved 9.15/10 in only 9 iterations by starting from a fundamentally better architecture (5-layer composition with MORPH_OVERLAP scene overlaps). Architecture quality determines the ceiling; iteration finds the optimum within that ceiling.
- v7 benefited from locking the script at 9.85 before any render iteration. When the narrative is strong, fewer render iterations are needed because the visual story is already coherent.

---

## Summary: The Iteration Hierarchy

The three iteration loops are not equal. They are ordered by leverage:

1. **Script iteration** (highest leverage) -- Determines the narrative ceiling. A 9.0+ script can be rendered well with modest effort. A 7.0 script cannot be rescued by production quality.
2. **Architecture selection** (not an iteration loop, but a design decision) -- Determines the production ceiling. v2's architecture capped at 6.5 regardless of iteration count. v5's architecture allowed 9.15 in 9 iterations.
3. **Voiceover iteration** (medium leverage) -- Affects emotional delivery. Genetic optimization converges efficiently but plateaus quickly.
4. **Render iteration** (lowest leverage per cycle) -- Fine-tunes visual polish. Important but only effective when script and architecture are already strong.

The critical lesson across all versions: **invest in quality at the highest level of abstraction first.** Iterating on renders with a weak script is the most common and most expensive mistake.

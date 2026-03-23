# 11-Criterion Script Scoring Rubric

Used for evaluating voiceover scripts before recording. Each criterion is scored
on a 10-point scale by Gemini, and 3+ scoring runs are averaged to account for
variance.

## Criteria

| #  | Criterion            | What It Measures                                                              |
|----|----------------------|-------------------------------------------------------------------------------|
| 1  | Flow & Continuity    | Does the script read as one continuous thought, not a list of disconnected scenes? |
| 2  | Speakability         | Can a narrator deliver every line naturally? No tongue-twisters, awkward phrasing, or unpronounceable terms. |
| 3  | Emotional Arc        | Does the script move through a clear emotional journey (curiosity, tension, resolution, inspiration)? |
| 4  | Visual-Audio Sync    | Does each line pair tightly with its intended visual? No lines that require visuals to arrive early or late. |
| 5  | Pacing               | Are there natural breaths? Does density vary (tight for energy, sparse for weight)? |
| 6  | Hook Strength        | Do the first 1-2 lines compel the viewer to keep watching?                    |
| 7  | Transition Quality   | Do scene-to-scene bridges feel motivated (not "and now we see...")?           |
| 8  | Specificity & Truth  | Are claims grounded in real data, real names, real numbers? No vague superlatives. |
| 9  | Thesis Landing       | Does the core value proposition ("Three PRs. One conversation." or equivalent) land with weight? |
| 10 | Overall Polish       | Sentence variety, rhythm, word choice, absence of filler.                     |
| 11 | Music Direction      | Do embedded music cues (tempo shifts, drops, swells) serve the narrative?     |

## Scoring Scale

Each criterion is scored 1-10:

| Score | Meaning                                         |
|-------|--------------------------------------------------|
| 1-3   | Fundamentally broken; needs full rewrite         |
| 4-5   | Below acceptable; multiple issues                |
| 6-7   | Functional but not polished                      |
| 8     | Good; minor improvements possible                |
| 9     | Excellent; ready for recording                   |
| 10    | Outstanding; would not change a word             |

## Lock Criteria

A script is considered locked (ready for voiceover recording) when:

1. The **average score across all 11 criteria** is >= 9.0.
2. The average is computed across **3 or more scoring runs** to smooth Gemini variance.
3. **No individual criterion** scores below 7.0 in any run (a floor requirement).

If any single criterion consistently scores below 8.0 across runs, it becomes the
targeted improvement focus for the next script revision.

## Usage

1. Feed the full script text to Gemini with the 11-criterion rubric prompt.
2. Run 3 times at temperature 0.1.
3. Average per-criterion scores and compute the overall mean.
4. If below 9.0, identify the lowest-scoring criterion and revise that aspect.
5. Re-score after revision. Repeat until lock criteria are met.

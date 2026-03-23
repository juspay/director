# Scoring Rubrics — Consolidated Reference

This document consolidates all three scoring rubric systems used across the video production pipeline. Each rubric serves a different evaluation domain: rendered video quality, script quality, and voiceover acoustic quality.

---

## 1. Video Scoring Rubric (7 Dimensions)

**Used in:** v5, v8 render iteration loops
**Method:** Gemini 3-run average scoring
**Scale:** Each dimension scored 0-10; final score is a weighted average

| # | Dimension | Weight | Description |
|---|-----------|--------|-------------|
| 1 | Visual Density | 20% | Number and variety of animated elements per frame. Measures whether the viewer's eye has continuous motion to follow. Penalizes static frames and single-element scenes. |
| 2 | Transition Quality | 15% | Smoothness, motivation, and creativity of scene-to-scene transitions. Evaluates whether transitions feel narratively motivated (not arbitrary) and whether they maintain visual continuity. |
| 3 | Pacing | 15% | Rhythm of information delivery. Evaluates whether the video maintains momentum without rushing, includes breathing room at emotional beats, and varies tempo across narrative acts. |
| 4 | Typography & Text | 10% | Legibility, animation, and design quality of on-screen text. Evaluates font choices, text reveal animations, reading time, and visual hierarchy. |
| 5 | Color & Mood | 15% | Consistency and intentionality of the color palette. Evaluates whether color temperature shifts match narrative mood (warm for positive, cool for tension), whether the palette is cohesive, and whether contrast ratios support readability. |
| 6 | Audio-Visual Sync | 15% | Alignment between visual events and audio cues. Evaluates whether transitions land on beats, text appears in sync with narration, and visual energy matches audio energy. |
| 7 | Emotional Impact | 10% | Overall emotional response. Evaluates whether the video produces the intended emotional journey (intrigue, tension, relief, confidence, resolution) and whether the viewer would watch to completion. |

### Scoring Guidelines

- **9-10:** Exceptional. Could be mistaken for a professional studio production.
- **7-8:** Strong. Noticeable quality with minor rough edges.
- **5-6:** Adequate. Communicates the message but lacks polish.
- **3-4:** Below average. Distracting issues that undermine the message.
- **1-2:** Poor. Fundamental problems in this dimension.

### Weighted Score Calculation

```
Final = (Visual Density * 0.20)
      + (Transition Quality * 0.15)
      + (Pacing * 0.15)
      + (Typography * 0.10)
      + (Color & Mood * 0.15)
      + (Audio-Visual Sync * 0.15)
      + (Emotional Impact * 0.10)
```

---

## 2. Script Scoring Rubric (11 Criteria)

**Used in:** v7 script iteration loop
**Method:** LLM evaluation per criterion
**Scale:** Each criterion scored 0-10; script locks when all criteria reach 9.0+

| # | Criterion | Description |
|---|-----------|-------------|
| 1 | Narrative Arc | Does the script follow a clear structure (hook, tension, resolution)? Is there a beginning, middle, and end that the viewer can feel? |
| 2 | Emotional Progression | Does the emotional tone shift intentionally across acts? Are transitions between moods (intrigue to tension to relief to confidence) earned rather than abrupt? |
| 3 | Specificity | Does the script use concrete details rather than abstractions? Does it name real tools, real actions, real outcomes instead of vague claims? |
| 4 | Pacing | Is the information density appropriate per section? Are there breathing moments after high-density passages? Does it avoid both rushing and dragging? |
| 5 | Voice Consistency | Does the narrator's voice feel like a single, consistent persona throughout? Are tone shifts motivated by content rather than inconsistency? |
| 6 | Hook Strength | Does the opening 10 seconds create enough intrigue or recognition to prevent the viewer from clicking away? |
| 7 | CTA Clarity | Is the call-to-action unambiguous? Does the viewer know exactly what to do after watching? |
| 8 | Redundancy | Is every sentence necessary? Are there repeated ideas or phrases that could be cut without losing meaning? |
| 9 | Visualizability | Can each sentence be mapped to a distinct visual? Are there sentences that would be difficult to illustrate or animate? |
| 10 | Audience Alignment | Does the script speak to the target audience's actual experience? Does it demonstrate understanding of their daily frustrations and aspirations? |
| 11 | Memorability | Does the script contain at least one line the viewer would remember or quote afterward? Is there a signature phrase or moment? |

### Lock Threshold

The script is locked when **every criterion scores 9.0 or above**. A single criterion below 9.0 blocks the lock regardless of how high other criteria score.

### Iteration Protocol

1. Score all 11 criteria.
2. Identify the single lowest-scoring criterion.
3. Rewrite only the sections that affect that criterion.
4. Re-score all 11 criteria (not just the targeted one).
5. If the targeted criterion improved and no other criterion regressed, keep the change.
6. If any criterion regressed, revert and try a different approach.
7. Repeat until all criteria meet the threshold.

---

## 3. Acoustic Scoring Rubric (8 Criteria)

**Used in:** v7 genetic voiceover optimization loop
**Method:** Automated acoustic analysis + LLM evaluation
**Scale:** Each criterion scored 0-10 with weighted composite; sweet spots define optimal ranges

| # | Criterion | Weight | Sweet Spot | Description |
|---|-----------|--------|------------|-------------|
| 1 | Clarity | 20% | 9.0+ | Speech intelligibility. Every word should be clearly audible without strain. Penalizes mumbling, clipping, excessive reverb, and consonant masking. |
| 2 | Pacing | 15% | 130-155 WPM | Speaking rate measured in words per minute. Too fast loses comprehension; too slow loses attention. The sweet spot varies by section (slower for emotional beats, faster for energetic passages). |
| 3 | Pitch Variation | 10% | 1.5-2.5 semitone std dev | Standard deviation of fundamental frequency across the take. Too flat (< 1.0) sounds robotic; too varied (> 3.0) sounds unhinged. The sweet spot produces natural, engaged delivery. |
| 4 | Emphasis Accuracy | 15% | N/A (binary per word) | Whether stressed words align with the script's intended emphasis points. Key nouns, verbs, and emotional pivot words should receive prosodic emphasis. |
| 5 | Breath Management | 10% | < 300ms inter-phrase gaps | Natural breathing that does not interrupt flow. Penalizes audible gasps, unnaturally long pauses, and missing pauses at sentence boundaries. |
| 6 | Warmth | 10% | Spectral centroid 200-400 Hz | Tonal quality of the voice. Evaluates whether the delivery sounds warm, trustworthy, and human rather than cold, mechanical, or overly processed. Measured via spectral centroid of the vocal range. |
| 7 | Emotional Match | 15% | N/A (per-section evaluation) | Whether the vocal emotion matches the script's intended emotion at each point. A tense section should sound tense; a warm section should sound warm. |
| 8 | Technical Quality | 5% | SNR > 40 dB, no artifacts | Signal-to-noise ratio, absence of digital artifacts (clicks, pops, encoding noise), consistent volume level, and proper normalization. |

### Weighted Composite Calculation

```
Composite = (Clarity * 0.20)
          + (Pacing * 0.15)
          + (Pitch Variation * 0.10)
          + (Emphasis Accuracy * 0.15)
          + (Breath Management * 0.10)
          + (Warmth * 0.10)
          + (Emotional Match * 0.15)
          + (Technical Quality * 0.05)
```

### Sweet Spot Enforcement

When a criterion has a defined sweet spot, scores are awarded on a bell curve centered on the sweet spot:
- Within sweet spot range: 9-10
- Within 1 unit of sweet spot boundary: 7-8
- Within 2 units: 5-6
- Beyond 2 units: score drops proportionally

This prevents the optimizer from pushing any single dimension to an extreme at the expense of naturalism.

---

## Cross-Rubric Usage

| Pipeline Stage | Rubric | Scored By | Lock Condition |
|---------------|--------|-----------|----------------|
| Script iteration | 11-criterion script | LLM | All criteria >= 9.0 |
| Voiceover iteration | 8-criterion acoustic | Automated + LLM | Plateau detection (3 iterations without improvement) |
| Render iteration | 7-dimension video | Gemini (3-run avg) | Score plateau or target met |

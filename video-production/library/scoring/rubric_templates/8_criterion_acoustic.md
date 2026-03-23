# 8-Criterion Voiceover Acoustic Scoring Rubric

Used for objective, signal-processing-based evaluation of recorded voiceover
audio. Unlike the video and script rubrics (which rely on Gemini), this rubric
is computed deterministically from audio analysis (librosa, scipy, numpy).

## Criteria

| # | Criterion        | Weight | Measurement                                           | Sweet Spot / Target         |
|---|------------------|--------|-------------------------------------------------------|-----------------------------|
| 1 | Pacing           | 0.15   | WPM deviation from target                             | Target WPM (e.g., 118 WPM) |
| 2 | Duration Fit     | 0.10   | Closeness to target duration                          | Within +/-2s of target      |
| 3 | Dynamic Range    | 0.15   | RMS 5th-95th percentile spread                        | 24-30 dB                    |
| 4 | Silence Quality  | 0.10   | Pause count and average pause duration                | 15-40 pauses, 0.3-0.8s avg |
| 5 | Energy Arc       | 0.20   | RMS mean across 5 script sections                     | Peak at demo section        |
| 6 | Spectral Warmth  | 0.10   | (low + mid) / high energy ratio                       | 3-8                         |
| 7 | Consistency      | 0.10   | RMS coefficient of variation                          | 0.85-1.05                   |
| 8 | Clarity          | 0.10   | Mean spectral centroid                                | 1500-3000 Hz               |

Total weight: 1.00

## Detailed Criterion Descriptions

### 1. Pacing (weight: 0.15)

Measures words-per-minute deviation from a target speaking rate. The target WPM
is typically set per-project (e.g., 118 WPM for a 2-minute explainer). Scores
decrease linearly as measured WPM diverges from target.

- 10/10: Exactly at target WPM
- 8/10: Within +/-5 WPM
- 5/10: Off by +/-15 WPM
- <3/10: Off by +/-25 WPM or more

### 2. Duration Fit (weight: 0.10)

How close the recorded audio duration is to the target duration. Accounts for
the need to fit voiceover precisely to scene timings in Remotion.

- 10/10: Within 0.5s of target
- 8/10: Within 2s of target
- 5/10: Within 5s of target
- <3/10: Off by 10s+

### 3. Dynamic Range (weight: 0.15)

RMS energy spread between the 5th and 95th percentiles, measured in dB. A
healthy dynamic range means the narrator varies emphasis without whispering or
shouting.

- Sweet spot: 24-30 dB
- Too narrow (<20 dB): monotone delivery
- Too wide (>35 dB): inconsistent levels, hard to mix

### 4. Silence Quality (weight: 0.10)

Measures two properties of pauses (silence regions):
- **Pause count**: 15-40 pauses across a 2-minute read indicates natural breathing
  and phrasing. Too few = rushed. Too many = choppy.
- **Average pause duration**: 0.3-0.8 seconds. Shorter = breathless. Longer =
  dead air that kills momentum.

### 5. Energy Arc (weight: 0.20)

The highest-weighted criterion. Splits the audio into 5 equal sections and
computes the RMS mean of each. The expected energy shape for a product
announcement is:

1. **Intro**: moderate energy (hook, but not peak)
2. **Setup**: slightly lower (explanatory)
3. **Demo/Execution**: PEAK energy (the climax of the product story)
4. **Reach/Ecosystem**: sustained high
5. **Close**: tapers to confident, warm conclusion

Scoring verifies that the peak occurs in the demo section (section 3) and that
the overall shape follows a build-peak-resolve arc.

### 6. Spectral Warmth (weight: 0.10)

Ratio of (low-frequency + mid-frequency) energy to high-frequency energy.

- Sweet spot: 3-8
- Too low (<2): thin, nasal, or sibilant
- Too high (>12): boomy, muddy

Bands:
- Low: 0-300 Hz
- Mid: 300-2000 Hz
- High: 2000+ Hz

### 7. Consistency (weight: 0.10)

RMS coefficient of variation across windowed segments. Measures how even the
narrator's volume is across the full read.

- Sweet spot: 0.85-1.05
- Too low (<0.7): robotic, no expression
- Too high (>1.2): wildly uneven levels

### 8. Clarity (weight: 0.10)

Mean spectral centroid across the recording. Higher centroid = brighter,
crisper articulation. Lower centroid = duller, less intelligible.

- Sweet spot: 1500-3000 Hz
- Below 1200 Hz: muffled
- Above 3500 Hz: harsh or over-processed

## Formula

```
OVERALL = sum(criterion_score[i] * weight[i] for i in 1..8)
```

Each criterion score is on a 10-point scale. The weighted sum produces the
overall acoustic score, also on a 10-point scale.

## Usage

1. Run the acoustic analysis script on the .wav file.
2. Each criterion is computed deterministically (no LLM needed).
3. Compare against sweet spots to generate per-criterion scores.
4. Compute the weighted overall.
5. If below target, identify the weakest criterion and re-record or post-process.

# 7-Dimension Weighted Video Scoring Rubric

Used by `gemini_video_scorer.py` (originating in v8) for Gemini-based multimodal video analysis.

## Dimensions and Weights

| Dim | Name                    | Weight | Focus                                                        |
|-----|-------------------------|--------|--------------------------------------------------------------|
| A   | Content Authenticity    | 25%    | Real data, genuine product screenshots, authentic names      |
| B   | Visual Polish           | 20%    | Color consistency, typography, glows, no rough edges         |
| C   | Motion Design           | 15%    | Spring quality, stagger, micro-animations, exits             |
| D   | Storytelling Arc        | 15%    | Hook, human moment, payoff                                   |
| E   | Scene Transitions       | 10%    | Visual bridges, morph quality                                |
| F   | Music/Audio Integration | 10%    | Continuous arc, strategic silences, tonal SFX                |
| G   | Production Value        |  5%    | Agency-level impression                                      |

## A. Content Authenticity (25%)

The single most important differentiator. The video must feel real, not like a
generic SaaS template.

Scoring criteria:
- Does the data look REAL? Real names, real messages, real context.
- Are Slack messages believable with actual team member names (e.g., Sarthak Singh, Sachin Sharma, Sai Ramcharan, Yaswanth Reddy)?
- Are repo names real and specific (Nimble, Vayu, juspay-portal) rather than generic placeholders?
- Does the AI assistant avatar look like a distinctive character, not a generic icon?
- Is the coding agent UI convincing (step list with checkmarks, real-looking terminal output)?
- Does the Slack UI look like actual Slack (dark mode, proper message layout, avatars, timestamps)?

## B. Visual Polish (20%)

- Typography: Professional-grade hierarchy, spacing, readability.
- Slack UI fidelity: Actual Slack dark mode (#1a1d21 background, proper borders).
- Color consistency across ALL scenes (no jarring palette shifts).
- Glow/shadow/depth effects: subtle, not overdone.
- Overall visual cleanliness: no alignment issues, no orphaned elements.

## C. Motion Design (15%)

- Animation smoothness and spring quality (Remotion spring() usage).
- Stagger timing between elements (messages appearing one by one, etc.).
- Enter/exit transitions for UI elements.
- Scene crossfades: smooth 1-second visual-only crossfades.
- Micro-animations adding life (typing indicators, status pulsing, etc.).

## D. Storytelling Arc (15%)

- Does the hook grab attention in the first 3 seconds?
- Does energy build from introduction through collaboration to execution?
- Is the "human judgment" moment effective (AI defers to the human)?
- Does the value proposition payoff land powerfully?
- Does the closing tagline resolve the video satisfyingly?

## E. Scene Transitions (10%)

- Do scenes flow INTO each other or feel like hard cuts / "scene walls"?
- Is there visual continuity between scenes (color, layout, rhythm)?
- Are crossfades smooth and professional (not abrupt)?
- Does pacing feel natural between scenes?

## F. Music/Audio Integration (10%)

- Does music build one continuous arc across the entire video?
- Does music volume automation enhance the narrative (quieter for dialogue, louder for climax)?
- Is narration/voiceover clear and well-paced?
- Do audio transitions between scenes feel seamless?

## G. Production Value (5%)

- Does the video look like a $5K+ agency production?
- Any rough edges, alignment issues, or amateur tells?
- Professional impression: would you show this to a VP of Engineering?
- Consistency between all scenes (same visual language throughout).

## Formula

```
OVERALL = A*0.25 + B*0.20 + C*0.15 + D*0.15 + E*0.10 + F*0.10 + G*0.05
```

Each dimension is scored on a 10-point scale. The weighted sum produces the
overall score, also on a 10-point scale.

## Target

**9.0 / 10** overall.

## Variance Handling: 3-Run Averaging

Gemini exhibits scoring variance of approximately +/-0.8 to 1.0 points when
re-scoring the same video with the same prompt. To produce a stable signal:

1. Run the scoring prompt 3 times per iteration.
2. Average the 3 overall scores.
3. Average each dimension score independently.
4. Record the variance (max - min) across runs.

The averaged score is the one used for iteration decisions. Individual run
scores are preserved in output JSON for audit purposes.
